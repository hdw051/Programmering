import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import MovieModal from "./components/MovieModal.jsx";
import MenuBar from "./components/MenuBar.jsx";
import { halls, predefinedMovies } from "./constants/movies";
import { formatDate, parseDate, getMonday } from "./utils/dateUtils";
import { generateAllDayTimeSlots, generateVisibleTimeSlots, buildWeekSchedule } from "./utils/schedulerUtils";
import "./styles/schedule.css";

// Define Firebase config and app ID for Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const LOCAL_STORAGE_KEY = `movies_${appId}`;

const loadLocalMovies = () => {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const saveLocalMovies = (moviesToSave) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(moviesToSave));
    } catch (e) {
        console.error('Error saving to localStorage', e);
    }
};

function App() {
    const [movies, setMovies] = useState([]);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [message, setMessage] = useState(''); // For user messages

    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [showMovieModal, setShowMovieModal] = useState(false);
    const [currentMovie, setCurrentMovie] = useState(null);

    // Define 15-minute time slots for the schedule (e.g., from 09:00 to 23:45)
    const [startHour, setStartHour] = useState(() => {
        const storedStartHour = localStorage.getItem('scheduleStartHour');
        return storedStartHour ? parseInt(storedStartHour, 10) : 9;
    });
    const [endHour, setEndHour] = useState(() => {
        const storedEndHour = localStorage.getItem('scheduleEndHour');
        return storedEndHour ? parseInt(storedEndHour, 10) : 23;
    });

    // Define ALL 15-minute time slots for a full 24-hour day (00:00 to 23:45)
    const allDayTimeSlots = useMemo(() => generateAllDayTimeSlots(), []);

    // Filter time slots based on startHour and endHour for visible schedule
    const visibleTimeSlots = useMemo(
        () => generateVisibleTimeSlots(startHour, endHour, allDayTimeSlots),
        [startHour, endHour, allDayTimeSlots]
    );

    const displayTimeSlots = visibleTimeSlots.filter(time => {
        const minute = parseInt(time.split(':')[1], 10);
        return minute === 0 || minute === 30;
    });

    // Reference for drag source to hold movie data during drag
    const dragMovieRef = useRef(null);


    // Initialize Firebase (if config provided) or fall back to local storage
    useEffect(() => {
        if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
            // No Firebase configuration: use local storage
            setMovies(loadLocalMovies());
            setUserId('local-user');
            setIsAuthReady(true);
            return;
        }
        try {
            const firebaseApp = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(firebaseApp);
            const firebaseAuth = getAuth(firebaseApp);
            setDb(firestoreDb);
            setAuth(firebaseAuth);

            if (initialAuthToken) {
                signInWithCustomToken(firebaseAuth, initialAuthToken)
                    .then(() => console.log('Signed in with custom token'))
                    .catch((error) => {
                        console.error('Error signing in with custom token:', error);
                        signInAnonymously(firebaseAuth).then(() => console.log('Signed in anonymously')).catch(console.error);
                    });
            } else {
                signInAnonymously(firebaseAuth)
                    .then(() => console.log('Signed in anonymously'))
                    .catch(console.error);
            }

            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    setUserId(crypto.randomUUID());
                }
                setIsAuthReady(true);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Fout bij het initialiseren van Firebase:", error);
            setMessage("Fout bij het initialiseren van de database. Er wordt lokaal opgeslagen.");
            setMovies(loadLocalMovies());
            setUserId('local-user');
            setIsAuthReady(true);
            setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
        }
    }, []);

    // Fetch movies from Firestore when auth is ready and userId is available
    useEffect(() => {
        if (!isAuthReady) return;

        if (!db) {
            // Local storage fallback
            setMovies(loadLocalMovies());
            return;
        }
        if (!auth || !userId) return;

        const moviesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/moviePrograms`);
        const q = query(moviesCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const moviesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                duration: doc.data().duration ? parseInt(doc.data().duration, 10) : 90
            }));
            setMovies(moviesData);
        }, (error) => {
            console.error("Fout bij het ophalen van films:", error);
            setMessage("Fout bij het ophalen van films. Controleer de console voor details.");
            setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
        });

        return () => unsubscribe();
    }, [db, auth, isAuthReady, userId]);

    const handleSaveMovie = async (movie) => {
        if (!db || !userId) {
            // Local fallback
            const id = movie.id || crypto.randomUUID();
            const updatedMovie = { ...movie, id };
            setMovies((prev) => {
                const exists = prev.some((m) => m.id === id);
                const newMovies = exists ? prev.map((m) => (m.id === id ? updatedMovie : m)) : [...prev, updatedMovie];
                return newMovies;
            });
            setMessage(`Film succesvol ${movie.id ? 'bijgewerkt' : 'toegevoegd'} (lokaal)!`);
            setShowMovieModal(false);
            setCurrentMovie(null);
            setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
            return;
        }

        try {
            if (movie.id) {
                const movieDocRef = doc(db, `artifacts/${appId}/users/${userId}/moviePrograms`, movie.id);
                await updateDoc(movieDocRef, movie);
                setMessage('Film succesvol bijgewerkt!');
            } else {
                await addDoc(collection(db, `artifacts/${appId}/users/${userId}/moviePrograms`), {
                    ...movie,
                    createdAt: new Date().toISOString()
                });
                setMessage('Film succesvol toegevoegd!');
            }
            setShowMovieModal(false); // Close modal after save
            setCurrentMovie(null); // Clear movie data
            setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
        } catch (e) {
            console.error("Fout bij toevoegen/bijwerken van film: ", e);
            setMessage('Fout bij het opslaan van de film. Probeer opnieuw.');
            setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
        }
    };

    const handleEditMovie = (movie) => {
        setCurrentMovie(movie);
        setShowMovieModal(true);
        setMessage(''); // Clear main app message when opening modal
    };

    const handleDeleteMovie = async (id) => {
        if (!db || !userId) {
            const confirmed = await showConfirmDialog('Weet je zeker dat je deze film wilt verwijderen?');
            if (confirmed) {
                setMovies((prev) => prev.filter((m) => m.id !== id));
                setMessage('Film succesvol verwijderd (lokaal)!');
                setTimeout(() => setMessage(''), 3000);
            }
            return;
        }
        const confirmed = await showConfirmDialog('Weet je zeker dat je deze film wilt verwijderen?');
        if (confirmed) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/moviePrograms`, id));
                setMessage('Film succesvol verwijderd!');
                setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
            } catch (e) {
                console.error("Fout bij verwijderen van film: ", e);
                setMessage('Fout bij het verwijderen van de film. Probeer opnieuw.');
                setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
            }
        }
    };

    // Persist locally when no database is available
    useEffect(() => {
        if (!db) {
            saveLocalMovies(movies);
        }
    }, [movies, db]);

    // Persist start and end hours to local storage
    useEffect(() => {
        localStorage.setItem('scheduleStartHour', startHour.toString());
        localStorage.setItem('scheduleEndHour', endHour.toString());
    }, [startHour, endHour]);

    const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return {
            fullDate: formatDate(date),
            dayName: new Intl.DateTimeFormat('nl-NL', { weekday: 'short' }).format(date),
            dayOfMonth: date.getDate()
        };
    });

    const currentWeekSchedule = useMemo(
        () =>
            buildWeekSchedule({
                movies,
                halls,
                daysOfWeek,
                visibleTimeSlots,
                allDayTimeSlots,
            }),
        [movies, halls, daysOfWeek, visibleTimeSlots, allDayTimeSlots]
    );

    const goToPreviousWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const goToToday = () => {
        setCurrentWeekStart(getMonday(new Date()));
    };

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmResolve, setConfirmResolve] = useState(null);

    const showConfirmDialog = (message) => {
        return new Promise((resolve) => {
            setConfirmMessage(message);
            setShowConfirm(true);
            setConfirmResolve(() => resolve);
        });
    };

    const handleConfirm = (result) => {
        setShowConfirm(false);
        if (confirmResolve) {
            confirmResolve(result);
            setConfirmResolve(null);
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e, movieBeingDragged = null) => {
        e.stopPropagation();
        
        if (movieBeingDragged) {
            // Store the movie data in the ref for use in handleDrop
            dragMovieRef.current = movieBeingDragged;
            
            // Set drag image to be the movie card
            const dragImage = e.currentTarget.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            
            // Clean up the drag image after a short delay
            setTimeout(() => {
                document.body.removeChild(dragImage);
            }, 0);
        } else {
            // Handle quick add drag
            const selectedMovie = predefinedMovies.find(m => m.title === selectedPredefinedMovieForQuickAdd);
            if (selectedMovie && selectedMovie.title !== 'Kies een film...') {
                dragMovieRef.current = {
                    title: selectedMovie.title,
                    duration: selectedMovie.duration
                };
            }
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        if (dragMovieRef.current) { // Only highlight if a draggable movie is active
            e.currentTarget.classList.add('drag-over');
        }
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow a drop
    };

    const handleDrop = async (e, dayFullDate, hallName, slotTime) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dragMovieRef.current) return;

        const movie = dragMovieRef.current;

        // Calculate the absolute datetime of the dropped slot
        const droppedSlotDateTime = new Date(parseDate(dayFullDate));
        const [hour, minute] = slotTime.split(':').map(Number);
        droppedSlotDateTime.setHours(hour, minute, 0, 0);

        // Calculate the datetime of the beginning of the day's schedule
        const startOfTodaySchedule = new Date(parseDate(dayFullDate));
        startOfTodaySchedule.setHours(startHour, 0, 0, 0);

        // Determine the actual movie start date
        let actualMovieStartDate = dayFullDate;
        if (droppedSlotDateTime < startOfTodaySchedule && hour < startHour) {
             // If the dropped time is before the schedule's start hour, assume it's for the next day.
             // This handles cases where the visible schedule wraps around midnight.
            const nextDay = new Date(parseDate(dayFullDate));
            nextDay.setDate(nextDay.getDate() + 1);
            actualMovieStartDate = formatDate(nextDay);
        }

        // Assemble candidate movie for overlap detection
        const candidateMovie = {
            ...movie,
            time: slotTime,
            date: actualMovieStartDate,
            hall: hallName,
        };

        // Overlaps are now allowed – keeping them visible instead of blocking.

        // Update movie with new time and date
        const updatedMovie = { ...candidateMovie };

        await handleSaveMovie(updatedMovie);
        dragMovieRef.current = null;
    };

    // --- Quick Add Dropdown Handler ---
    const handlePredefinedMovieForQuickAddChange = (e) => {
        setSelectedPredefinedMovieForQuickAdd(e.target.value);
    };

    const handleCellDoubleClick = async (dayFullDate, hallName, slotTime) => {
        setMessage(''); // Clear any previous messages

        const selectedMovie = predefinedMovies.find(m => m.title === selectedPredefinedMovieForQuickAdd);

         // Calculate the absolute datetime of the dropped slot
        const droppedSlotDateTime = new Date(parseDate(dayFullDate));
        const [hour, minute] = slotTime.split(':').map(Number);
        droppedSlotDateTime.setHours(hour, minute, 0, 0);

        // Calculate the datetime of the beginning of the day's schedule
        const startOfTodaySchedule = new Date(parseDate(dayFullDate));
        startOfTodaySchedule.setHours(startHour, 0, 0, 0);

        // Determine the actual movie start date
        let actualMovieStartDate = dayFullDate;
        if (droppedSlotDateTime < startOfTodaySchedule && hour < startHour) {
             // If the dropped time is before the schedule's start hour, assume it's for the next day.
             // This handles cases where the visible schedule wraps around midnight.
            const nextDay = new Date(parseDate(dayFullDate));
            nextDay.setDate(nextDay.getDate() + 1);
            actualMovieStartDate = formatDate(nextDay);
        }

        if (selectedMovie && selectedMovie.title !== 'Kies een film...') {
            // Quick add with predefined movie
            const newMovie = {
                title: selectedMovie.title,
                duration: selectedMovie.duration,
                date: actualMovieStartDate, // Use the adjusted date
                time: slotTime,
                hall: hallName,
            };

            await handleSaveMovie(newMovie); // Add directly
        } else {
            // Open modal for manual input or selection
            setCurrentMovie({ date: actualMovieStartDate, time: slotTime, hall: hallName }); // Use the adjusted date
            setShowMovieModal(true);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <MenuBar
                selectedPredefinedMovieForQuickAdd={selectedPredefinedMovieForQuickAdd}
                handlePredefinedMovieForQuickAddChange={handlePredefinedMovieForQuickAddChange}
                predefinedMovies={predefinedMovies}
            />
            {/* Main programming schedule */}
            <>
                <div className="date-navigation">
                    <button onClick={goToPreviousWeek}>← Vorige week</button>
                    <button onClick={goToToday}>Vandaag</button>
                    <button onClick={goToNextWeek}>Volgende week →</button>
                    <span className="current-week">
                        {new Intl.DateTimeFormat('nl-NL', { 
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        }).format(currentWeekStart)}
                    </span>
                </div>
                <div className="schedule-grid-container">
                    <div className="schedule-grid" style={{
                        gridTemplateRows: `auto repeat(${halls.length * daysOfWeek.length}, clamp(20px, 3vh, 24px))`,
                        gridTemplateColumns: `repeat(2, 1fr) repeat(${visibleTimeSlots.length}, 1fr)`
                        // minWidth: 'max-content' // Removed to allow columns to fit within screen
                    }}>
                        {/* Corner header cell */}
                        <div className="time-header" style={{ gridColumn: '1 / span 2', gridRow: 1 }}></div>

                        {/* Time Headers */}
                        {displayTimeSlots.map((time) => {
                            const originalIndex = visibleTimeSlots.indexOf(time);
                            if (originalIndex === -1) return null; // Should not happen
                            return (
                                <div
                                    key={`time-header-${time}`}
                                    className="time-header"
                                    style={{
                                        gridColumn: `${originalIndex + 3} / span 2`,
                                        gridRow: 1,
                                    }}
                                >
                                    {time}
                                </div>
                            );
                        })}

                        {/* Hall Headers, Day Headers, and Time Slots/Movies */}
                        {halls.map((hall, hallIndex) => (
                            <React.Fragment key={hall}>
                                {/* Hall Header */}
                                <div
                                    className="hall-header"
                                    style={{
                                        gridColumn: 1,
                                        gridRow: `${hallIndex * daysOfWeek.length + 2} / span ${daysOfWeek.length}`,
                                        // minWidth: 'clamp(40px, 5vw, 60px)' // Removed to allow columns to fit within screen
                                    }}
                                >
                                    {hall}
                                </div>

                                {/* Day Headers and Time Slots/Movies for this Hall */}
                                {daysOfWeek.map((day, dayIndex) => {
                                    const row = hallIndex * daysOfWeek.length + dayIndex + 2;
                                    const isLastDayOfHall = dayIndex === daysOfWeek.length - 1;

                                    return (
                                        <React.Fragment key={day.fullDate}>
                                            {/* Day Header */}
                                            <div
                                                className="day-header"
                                                style={{ 
                                                    gridColumn: 2, 
                                                    gridRow: row,
                                                    // minWidth: 'clamp(40px, 5vw, 60px)' // Removed to allow columns to fit within screen
                                                }}
                                            >
                                                {day.dayName} {day.dayOfMonth}
                                            </div>

                                            {/* Time Slots/Movies for this Day and Hall */}
                                            {visibleTimeSlots.map((time, slotIndex) => {
                                                const cellContent = currentWeekSchedule[hall]?.[day.fullDate]?.[slotIndex];
                                                const col = slotIndex + 3;
                                                const row = hallIndex * daysOfWeek.length + dayIndex + 2;

                                                if (cellContent && cellContent !== 'SPANNED') {
                                                    const movie = cellContent;
                                                    const shouldRender = slotIndex === 0 || currentWeekSchedule[hall][day.fullDate][slotIndex - 1] !== movie;
                                                    if (shouldRender) {
                                                        return (
                                                            <div
                                                                key={movie.id}
                                                                className="movie-card fade-in"
                                                                onClick={() => handleEditMovie(movie)}
                                                                draggable="true"
                                                                onDragStart={(e) => handleDragStart(e, movie)}
                                                                style={{
                                                                    gridColumn: `${col} / span ${Math.ceil(movie.duration / 15)}`,
                                                                    gridRow: row,
                                                                    borderBottom: isLastDayOfHall ? '4px solid #ffffff' : undefined,
                                                                }}
                                                            >
                                                                <div className="movie-info">
                                                                    <span className="movie-time">{movie.time}</span>
                                                                    <span className="movie-title">{movie.title}</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteMovie(movie.id); }}
                                                                    className="delete-button"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }

                                                return (
                                                    <div
                                                        key={`${hall}-${day.fullDate}-${time}`}
                                                        className="time-slot"
                                                        onDoubleClick={() => handleCellDoubleClick(day.fullDate, hall, time)}
                                                        onDragOver={handleDragOver}
                                                        onDrop={(e) => handleDrop(e, day.fullDate, hall, time)}
                                                        onDragEnter={handleDragEnter}
                                                        onDragLeave={handleDragLeave}
                                                        style={{
                                                            gridColumn: col,
                                                            gridRow: row,
                                                            borderBottom: isLastDayOfHall ? '4px solid #ffffff' : undefined,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </>
            {showMovieModal && (
                <MovieModal
                    show={showMovieModal}
                    onClose={() => setShowMovieModal(false)}
                    movieData={currentMovie}
                    onSave={handleSaveMovie}
                    message={message}
                    clearMessage={() => setMessage('')}
                />
            )}
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <p className="text-lg mb-4">{confirmMessage}</p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => handleConfirm(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                                Annuleren
                            </button>
                            <button
                                onClick={() => handleConfirm(true)}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                            >
                                Verwijderen
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {message && (
                <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg fade-in">
                    {message}
                </div>
            )}
        </div>
    );
}

export default App;
