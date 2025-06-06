/*
 * Scheduler utility functions
 * ---------------------------
 * This module contains all pure helper functions that the UI uses to build and manipulate the
 * weekly movie-programming schedule.  Keeping these functions isolated makes them easier to
 * unit-test and reason about.
 *
 * IMPORTANT: All functions in this file are intentionally pure – they do not mutate any of the
 * arguments that are passed in and they do not depend on any external state.  This guarantees a
 * predictable, side-effect-free data-flow inside the React components that use them.
 */

/**
 * Generates every 15-minute timeslot for a 24-hour day.
 *
 * @return {string[]} Array with 96 entries formatted as "HH:MM" from "00:00" to "23:45".
 */
export const generateAllDayTimeSlots = () =>
    Array.from({ length: 24 * 4 }, (_, i) => {
        const totalMinutes = i * 15;
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    });

/**
 * Returns the subset of time-slots that should be visible in the scheduler, given the inclusive
 * start-hour and exclusive end-hour chosen by the user.
 *
 * A typical configuration is 9 → 23 which yields every 15-minute slot starting at 09:00 up to and
 * including 22:45.
 *
 * @param {number} startHour ‑ Hour in 24-h format (0-23) at which the visible range begins.
 * @param {number} endHour   ‑ Hour in 24-h format (1-24) at which the visible range ends.
 * @param {string[]} allDayTimeSlots – Output from {@link generateAllDayTimeSlots}.
 * @return {string[]} Sub-array of `allDayTimeSlots` representing the desired visible window.
 */
export const generateVisibleTimeSlots = (startHour, endHour, allDayTimeSlots) => {
    const startIndex = allDayTimeSlots.indexOf(`${String(startHour).padStart(2, '0')}:00`);
    const endIndexRaw = endHour === 24 ? allDayTimeSlots.length : allDayTimeSlots.indexOf(`${String(endHour).padStart(2, '0')}:00`);

    // Guard against mis-configuration.
    if (startIndex === -1 || endIndexRaw === -1 || startIndex >= endIndexRaw) {
        // Fallback to 09:00-23:45 – this mirrors the original behaviour.
        const defaultStartIndex = allDayTimeSlots.indexOf('09:00');
        const defaultEndIndex = allDayTimeSlots.indexOf('23:45') + 1; // include 23:45
        return allDayTimeSlots.slice(defaultStartIndex, defaultEndIndex);
    }
    return allDayTimeSlots.slice(startIndex, endIndexRaw);
};

/**
 * Builds the full schedule grid for a single week.
 *
 * The resulting data-structure is a nested object: `{ [hall]: { [ISODate]: Movie | null } }` where
 * the innermost arrays have the same length as `visibleTimeSlots`.  Each element holds either the
 * movie that starts in that slot, or the string "SPANNED" to denote that the slot is covered by a
 * movie that started earlier, or `null` when no movie is scheduled.
 *
 * NOTE: Collisions are expected to have been prevented beforehand (e.g. by {@link hasOverlap}).
 * This function therefore does **not** attempt to handle collisions – it simply writes whatever it
 * receives so the UI can render a visual representation of the data.
 */
export const buildWeekSchedule = ({
    movies,
    halls,
    daysOfWeek,
    visibleTimeSlots,
    allDayTimeSlots,
}) => {
    const hallDaySlotMapping = {};

    // Initialise the grid with nulls.
    daysOfWeek.forEach(day => {
        halls.forEach(hall => {
            hallDaySlotMapping[hall] = hallDaySlotMapping[hall] || {};
            hallDaySlotMapping[hall][day.fullDate] = Array(allDayTimeSlots.length).fill(null);
        });
    });

    // Sort movies in a deterministic order (date→time) – this makes testing easier and guarantees
    // that earlier movies win when overlaps *do* sneak in.
    const sortedMovies = [...movies].sort((a, b) => {
        const dateComparison = new Date(a.date) - new Date(b.date);
        if (dateComparison !== 0) return dateComparison;
        return allDayTimeSlots.indexOf(a.time) - allDayTimeSlots.indexOf(b.time);
    });

    // Place every movie into the 24-h grid, handling crossings past midnight by spilling over to
    // the next day.
    sortedMovies.forEach(movie => {
        const startSlotIndex = allDayTimeSlots.indexOf(movie.time);
        if (startSlotIndex === -1) {
            console.warn(`Ignoring movie with invalid start-time «${movie.time}»:`, movie);
            return;
        }

        const totalSlots = Math.ceil(movie.duration / 15);
        let currentDayIdx = daysOfWeek.findIndex(day => day.fullDate === movie.date);
        if (currentDayIdx === -1) {
            console.warn(`Ignoring movie with invalid date «${movie.date}»:`, movie);
            return;
        }

        for (let i = 0; i < totalSlots; i += 1) {
            const slotIndex = startSlotIndex + i;
            let targetDayIdx = currentDayIdx;
            let slotInDay = slotIndex;

            if (slotIndex >= allDayTimeSlots.length) {
                targetDayIdx += 1; // rolled over past midnight.
                slotInDay = slotIndex - allDayTimeSlots.length;
            }
            if (targetDayIdx >= daysOfWeek.length) break; // we only render one week.

            const dayKey = daysOfWeek[targetDayIdx].fullDate;
            const hallSlots = hallDaySlotMapping[movie.hall][dayKey];
            hallSlots[slotInDay] = movie; // we do not mark spanned slots here – that is a UI concern
        }
    });

    // Finally, collapse the 24-h grid down to the user-visible viewport.
    const finalMapping = {};
    halls.forEach(hall => {
        finalMapping[hall] = {};
        daysOfWeek.forEach(day => {
            const visibleRow = Array(visibleTimeSlots.length).fill(null);
            const fullRow = hallDaySlotMapping[hall][day.fullDate];
            visibleTimeSlots.forEach((time, idx) => {
                const allDayIdx = allDayTimeSlots.indexOf(time);
                visibleRow[idx] = fullRow[allDayIdx];
            });
            finalMapping[hall][day.fullDate] = visibleRow;
        });
    });

    return finalMapping;
};

/**
 * Detects whether `candidate` would overlap with any of the already scheduled movies.
 *
 * @param {Object} candidate              – Movie-like object with `{ date, time, duration, hall }`.
 * @param {Object[]} existingMovies       – Array of movie objects.
 * @return {boolean}                      – `true` if an overlap is detected.
 */
export const hasOverlap = (candidate, existingMovies) => {
    const startDateTime = new Date(`${candidate.date}T${candidate.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + candidate.duration * 60 * 1000);

    return existingMovies.some(movie => {
        if (movie.id === candidate.id) return false; // ignore self when dragging
        if (movie.hall !== candidate.hall) return false; // different hall – no conflict

        const movieStart = new Date(`${movie.date}T${movie.time}:00`);
        const movieEnd = new Date(movieStart.getTime() + movie.duration * 60 * 1000);

        return startDateTime < movieEnd && endDateTime > movieStart;
    });
}; 