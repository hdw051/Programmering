import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';

// Define Firebase config and app ID for Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Helper function to format date to 'YYYY-MM-DD'
const formatDate = (date) => date.toISOString().split('T')[0];

// Helper function to parse 'YYYY-MM-DD' to Date object
const parseDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// Helper function to get the Monday of the week for a given date
const getMonday = (d) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday (0 = Sunday, 1 = Monday, etc.)
    return new Date(d.getFullYear(), d.getMonth(), diff);
};

// Hardcoded halls for the cinema
const halls = ['Zaal 1', 'Zaal 2', 'Zaal 3', 'Zaal 4']; // Define your cinema halls here

// Predefined movies (you can expand this list or load from Firestore)
const predefinedMovies = [
    { title: 'Kies een film...', genre: '', duration: '' }, // Placeholder
    { title: 'Dune: Part Two', genre: 'Sci-Fi', duration: 166 },
    { title: 'Inside Out 2', genre: 'Animatie', duration: 96 },
    { title: 'Bad Boys: Ride or Die', genre: 'Actie/Komedie', duration: 115 },
    { title: 'Deadpool & Wolverine', genre: 'Actie/Komedie', duration: 127 },
    { title: 'Furiosa: A Mad Max Saga', genre: 'Actie/Sci-Fi', duration: 148 },
    { title: 'Despicable Me 4', genre: 'Animatie/Komedie', duration: 95 },
    { title: 'The Super Mario Bros. Movie', genre: 'Animatie', duration: 92 },
    { title: 'Elemental', genre: 'Animatie', duration: 101 },
    { title: 'The Little Mermaid', genre: 'Fantasie', duration: 135 },
    { title: 'Joy Ride', genre: 'Komedie', duration: 95 },
    { title: 'De Oneindig', genre: 'Drama', duration: 110 },
    { title: 'Ruby Kieuwman', genre: 'Komedie', duration: 98 },
    { title: 'Spider-Man: Across the Spider-Verse', genre: 'Animatie', duration: 140 },
    { title: 'Casper en Emma', genre: 'Kinderfilm', duration: 75 },
    { title: 'Indiana Jones and the Dial of Destiny', genre: 'Actie/Avontuur', duration: 154 },
    { title: 'Insidious: The Red Door', genre: 'Horror', duration: 107 },
    { title: 'Juf Roos', genre: 'Kinderfilm', duration: 60 },
    { title: 'Mission: Impossible - Dead Reckoning Part One', genre: 'Actie', duration: 163 },
    { title: 'The Flash', genre: 'Actie/Sci-Fi', duration: 144 },
    { title: 'Oppenheimer', genre: 'Biografie/Drama', duration: 180 },
    { title: 'Barbie', genre: 'Komedie', duration: 114 },
    { title: 'Meg 2: The Trench', genre: 'Actie/Sci-Fi', duration: 116 },
    { title: 'Gran Turismo', genre: 'Actie/Drama', duration: 134 },
    { title: 'The Nun II', genre: 'Horror', duration: 110 },
    { title: 'A Haunting in Venice', genre: 'Mysterie/Misdaad', duration: 103 },
    { title: 'Expend4bles', genre: 'Actie', duration: 103 },
    { title: 'The Creator', genre: 'Sci-Fi', duration: 133 },
    { title: 'Saw X', genre: 'Horror', duration: 118 },
    { title: 'Taylor Swift: The Eras Tour', genre: 'Concertfilm', duration: 165 },
    { title: 'Five Nights at Freddy\'s', genre: 'Horror', duration: 109 },
];

// Modal Component for adding/editing movies
function MovieModal({
    show,
    onClose,
    movieData,
    onSave,
    predefinedMovies,
    halls,
    message,
    clearMessage
}) {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const [genre, setGenre] = useState('');
    const [date, setDate] = useState(formatDate(new Date()));
    const [duration, setDuration] = useState('');
    const [selectedHall, setSelectedHall] = useState(halls[0]);
    const [selectedPredefinedMovie, setSelectedPredefinedMovie] = useState('');
    const [internalMessage, setInternalMessage] = useState('');

    useEffect(() => {
        if (show) {
            // Set initial state for the modal form based on movieData or defaults
            const currentTitle = movieData?.title || '';
            setTitle(currentTitle);
            setTime(movieData?.time || '');
            setGenre(movieData?.genre || '');
            setDate(movieData?.date || formatDate(new Date()));
            setDuration(String(movieData?.duration || ''));
            setSelectedHall(movieData?.hall || halls[0]);
            setSelectedPredefinedMovie(currentTitle); // Select in dropdown if it matches

            setInternalMessage(message); // Pass external message to internal
        }
    }, [show, movieData, halls, message]);

    // Clear internal message when modal is opened or user interacts
    useEffect(() => {
        if (show) {
            setInternalMessage('');
            if (clearMessage) clearMessage();
        }
    }, [show, clearMessage]);


    const handlePredefinedMovieChange = (e) => {
        const selectedTitle = e.target.value;
        setSelectedPredefinedMovie(selectedTitle);

        if (selectedTitle === 'Kies een film...') {
            setTitle('');
            setGenre('');
            setDuration('');
            return;
        }

        const movie = predefinedMovies.find(m => m.title === selectedTitle);
        if (movie) {
            setTitle(movie.title);
            setGenre(movie.genre);
            setDuration(String(movie.duration));
        }
    };

    const handleSubmit = () => {
        if (!title || !time || !genre || !date || !duration || !selectedHall) {
            setInternalMessage('Vul alle velden in (titel, tijd, genre, datum, duur, zaal).');
            return;
        }
        const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            setInternalMessage('Tijd moet in HH:MM formaat zijn (bijv. 20:00).');
            return;
        }
        if (isNaN(parseInt(duration, 10)) || parseInt(duration, 10) <= 0) {
            setInternalMessage('Duur moet een positief getal zijn.');
            return;
        }

        onSave({
            id: movieData ? movieData.id : null,
            title,
            time,
            genre,
            date,
            duration: parseInt(duration, 10),
            hall: selectedHall
        });
        // onClose is called by handleSaveMovie in parent
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-purple-700 bg-opacity-95 p-6 rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
                <h2 className="text-2xl font-semibold mb-5 text-center">{movieData ? 'Film bewerken' : 'Film toevoegen'}</h2>
                {internalMessage && (
                    <div className="bg-yellow-400 text-purple-900 p-3 rounded-md mb-4 text-center shadow-md animate-bounce-in">
                        {internalMessage}
                    </div>
                )}
                <div className="grid grid-cols-1 gap-4">
                    <select
                        value={selectedPredefinedMovie}
                        onChange={handlePredefinedMovieChange}
                        className="p-3 rounded-md bg-purple-800 border border-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 appearance-none"
                    >
                        {predefinedMovies.map(movie => (
                            <option key={movie.title} value={movie.title}>
                                {movie.title} {movie.duration ? `(${movie.duration} min)` : ''}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Filmtitel"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="p-3 rounded-md bg-purple-800 border border-purple-600 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
                    />
                    <input
                        type="time"
                        placeholder="Tijd (HH:MM)"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="p-3 rounded-md bg-purple-800 border border-purple-600 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
                    />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-3 rounded-md bg-purple-800 border border-purple-600 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
                    />
                    <input
                        type="number"
                        placeholder="Duur (minuten)"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="p-3 rounded-md bg-purple-800 border border-purple-600 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
                    />
                    <select
                        value={selectedHall}
                        onChange={(e) => setSelectedHall(e.target.value)}
                        className="p-3 rounded-md bg-purple-800 border border-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 appearance-none"
                    >
                        {halls.map(hallName => (
                            <option key={hallName} value={hallName}>{hallName}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 mt-4"
                    >
                        {movieData ? 'Film bijwerken' : 'Film toevoegen'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 mt-2"
                    >
                        Annuleren
                    </button>
                </div>
            </div>
        </div>
    );
}

// Menu Bar Component
function MenuBar({
    selectedPredefinedMovieForQuickAdd,
    handlePredefinedMovieForQuickAddChange,
    handleDragStart,
    handleOpenMovieModal,
    predefinedMovies,
    currentPage,
    setCurrentPage,
    viewMode,
    toggleViewMode
}) {
    return (
        <div className="bg-purple-800 text-white w-full py-3 px-6 shadow-xl flex flex-col sm:flex-row items-center justify-between sticky top-0 z-20">
            <h1 className="text-xl font-bold mb-2 sm:mb-0 mr-4">Bioscoop Planner</h1>
            <nav className="flex gap-4 mb-2 sm:mb-0">
                <button
                    onClick={() => setCurrentPage('programming')}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${currentPage === 'programming' ? 'bg-indigo-600' : 'bg-purple-700 hover:bg-purple-600'}`}
                >
                    Programmering
                </button>
                <button
                    onClick={() => setCurrentPage('movieManagement')}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${currentPage === 'movieManagement' ? 'bg-indigo-600' : 'bg-purple-700 hover:bg-purple-600'}`}
                >
                    Filmbeheer
                </button>
                <button
                    onClick={() => setCurrentPage('settings')}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${currentPage === 'settings' ? 'bg-indigo-600' : 'bg-purple-700 hover:bg-purple-600'}`}
                >
                    Instellingen
                </button>
            </nav>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                {currentPage === 'programming' && ( // Only show quick-add on Programming page
                    <>
                        <select
                            value={selectedPredefinedMovieForQuickAdd}
                            onChange={handlePredefinedMovieForQuickAddChange}
                            className="p-2 rounded-md bg-purple-700 border border-purple-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 appearance-none flex-grow"
                        >
                            {predefinedMovies.map(movie => (
                                <option key={movie.title} value={movie.title}>
                                    {movie.title} {movie.duration ? `(${movie.duration} min)` : ''}
                                </option>
                            ))}
                        </select>

                        {selectedPredefinedMovieForQuickAdd && selectedPredefinedMovieForQuickAdd !== 'Kies een film...' && (
                            <div
                                className="draggable-movie-preview px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-grab transition-colors duration-200 shadow-md"
                                draggable="true"
                                onDragStart={handleDragStart}
                            >
                                Sleep film: {selectedPredefinedMovieForQuickAdd}
                            </div>
                        )}
                    </>
                )}
                <button
                    onClick={handleOpenMovieModal}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex-shrink-0"
                >
                    Film handmatig toevoegen
                </button>
                {currentPage === 'programming' && ( // Only show view mode toggle on Programming page
                    <button
                        onClick={toggleViewMode}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md flex-shrink-0"
                    >
                        Schakel naar {viewMode === 'hall' ? 'Overzicht per dag' : 'Overzicht per zaal'}
                    </button>
                )}
            </div>
        </div>
    );
}

// New component for movie management
function MovieManagementPage({ movies, handleEditMovie, handleDeleteMovie }) {
    return (
        <div className="bg-purple-700 bg-opacity-70 p-6 rounded-xl shadow-2xl w-full max-w-5xl lg:max-w-7xl">
            <h2 className="text-2xl font-semibold mb-5 text-center">Filmbeheer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movies.length > 0 ? (
                    movies.map(movie => (
                        <div key={movie.id} className="bg-purple-800 p-4 rounded-lg shadow-md flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold">{movie.title}</h3>
                                <p className="text-purple-300 text-sm">Datum: {movie.date}</p>
                                <p className="text-purple-300 text-sm">Tijd: {movie.time}</p>
                                <p className="text-purple-300 text-sm">Zaal: {movie.hall}</p>
                                <p className="text-purple-300 text-sm">Duur: {movie.duration} min</p>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => handleEditMovie(movie)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                                >
                                    Bewerk
                                </button>
                                <button
                                    onClick={() => handleDeleteMovie(movie.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                                >
                                    Verwijder
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-purple-300 col-span-full">Geen films gevonden in de programmering.</p>
                )}
            </div>
        </div>
    );
}

// New component for settings
function SettingsPage() {
    return (
        <div className="bg-purple-700 bg-opacity-70 p-6 rounded-xl shadow-2xl w-full max-w-5xl lg:max-w-7xl">
            <h2 className="text-2xl font-semibold mb-5 text-center">Instellingen</h2>
            <p className="text-lg">Hier komen de instellingen van de applicatie.</p>
            {/* Future settings like changing start/end hours, default view, etc. */}
        </div>
    );
}

function App() {
    const [movies, setMovies] = useState([]);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [message, setMessage] = useState(''); // For user messages

    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [showMovieModal, setShowMovieModal] = useState(false);
    const [movieDataForModal, setMovieDataForModal] = useState(null); // Data to pass to modal for editing/pre-filling

    const [selectedPredefinedMovieForQuickAdd, setSelectedPredefinedMovieForQuickAdd] = useState('Kies een film...'); // Initialize with placeholder
    const [viewMode, setViewMode] = useState('hall'); // 'hall' (default) or 'day'
    const [currentPage, setCurrentPage] = useState('programming'); // Default page is 'programming'

    // Define 15-minute time slots for the schedule (e.g., from 09:00 to 23:45)
    const startHour = 9;
    const endHour = 23;
    const totalSlots = (endHour - startHour + 1) * 4;
    const timeSlots = Array.from({ length: totalSlots }, (_, i) => {
        const totalMinutes = (startHour * 60) + (i * 15);
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    });

    // Reference for drag source to hold movie data during drag
    const dragMovieRef = useRef(null);


    // Initialize Firebase and set up authentication listener
    useEffect(() => {
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
            setMessage("Fout bij het initialiseren van de database. Controleer de console voor details.");
            setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
        }
    }, []);

    // Fetch movies from Firestore when auth is ready and userId is available
    useEffect(() => {
        if (!db || !auth || !isAuthReady || !userId) return;

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
            setMessage('Database is niet klaar of gebruiker is niet ingelogd.');
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
            setMovieDataForModal(null); // Clear modal data
            // selectedPredefinedMovieForQuickAdd is intentionally NOT cleared here to keep selection
            setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
        } catch (e) {
            console.error("Fout bij toevoegen/bijwerken van film: ", e);
            setMessage('Fout bij het opslaan van de film. Probeer opnieuw.');
            setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
        }
    };

    const handleEditMovie = (movie) => {
        setMovieDataForModal(movie);
        setShowMovieModal(true);
        setMessage(''); // Clear main app message when opening modal
    };

    const handleDeleteMovie = async (id) => {
        if (!db || !userId) {
            setMessage('Database is niet klaar of gebruiker is niet ingelogd.');
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

    const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return {
            fullDate: formatDate(date),
            dayName: new Intl.DateTimeFormat('nl-NL', { weekday: 'short' }).format(date),
            dayOfMonth: date.getDate()
        };
    });

    const weekSchedule = useCallback(() => {
        const hallDaySlotMapping = {}; // Corrected variable name here

        halls.forEach(hall => {
            hallDaySlotMapping[hall] = {};
            daysOfWeek.forEach(day => {
                hallDaySlotMapping[hall][day.fullDate] = Array(timeSlots.length).fill(null);
            });
        });

        movies.forEach(movie => {
            const { date, hall, time, duration } = movie;
            if (!hallDaySlotMapping[hall] || !hallDaySlotMapping[hall][date]) {
                // This movie is not for the current week or a valid hall, skip it
                return;
            }

            const movieStartMinutes = parseInt(time.split(':')[0], 10) * 60 + parseInt(time.split(':')[1], 10);
            const slotStartTotalMinutes = startHour * 60; // Start of the displayable time range
            let startSlotIndex = Math.floor((movieStartMinutes - slotStartTotalMinutes) / 15);

            // Ensure index is within the bounds of timeSlots array
            startSlotIndex = Math.max(0, startSlotIndex);
            if (startSlotIndex >= timeSlots.length) {
                return; // Movie starts outside the visible time range
            }

            let spanSlots = Math.max(1, Math.ceil(duration / 15));
            // Cap spanSlots so it doesn't extend beyond the end of the current day's time slots
            const remainingSlotsInDay = timeSlots.length - startSlotIndex;
            spanSlots = Math.min(spanSlots, remainingSlotsInDay);


            hallDaySlotMapping[hall][date][startSlotIndex] = {
                ...movie,
                spanSlots: spanSlots,
                startSlotIndex: startSlotIndex
            };

            for (let i = 1; i < spanSlots; i++) {
                const currentSpanSlotIndex = startSlotIndex + i;
                if (currentSpanSlotIndex < timeSlots.length) { // Ensure within bounds
                    hallDaySlotMapping[hall][date][currentSpanSlotIndex] = 'SPANNED';
                }
            }
        });
        return hallDaySlotMapping;
    }, [movies, daysOfWeek, halls, timeSlots]);

    const currentWeekSchedule = weekSchedule();

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

    const toggleViewMode = () => {
        setViewMode(prevMode => (prevMode === 'hall' ? 'day' : 'hall'));
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
        if (movieBeingDragged) {
            // Dragging an existing movie from the schedule
            e.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'existing',
                id: movieBeingDragged.id,
                title: movieBeingDragged.title,
                genre: movieBeingDragged.genre,
                duration: movieBeingDragged.duration,
                originalDate: movieBeingDragged.date,
                originalHall: movieBeingDragged.hall,
                originalTime: movieBeingDragged.time
            }));
            dragMovieRef.current = { id: movieBeingDragged.id, type: 'existing' };
        } else {
            // Dragging a new movie from the quick add menu
            const selectedMovie = predefinedMovies.find(m => m.title === selectedPredefinedMovieForQuickAdd);
            if (selectedMovie && selectedMovie.title !== 'Kies een film...') {
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'new', movie: selectedMovie }));
                dragMovieRef.current = { type: 'new', movie: selectedMovie };
            } else {
                e.preventDefault(); // Prevent drag if no movie selected
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
        e.currentTarget.classList.remove('drag-over'); // Remove highlight on drop

        let draggedData;
        try {
            draggedData = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch (error) {
            console.error("Error parsing dragged movie data:", error);
            setMessage("Fout bij het verwerken van slepen en neerzetten.");
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        if (draggedData && draggedData.type === 'existing') {
            // Dragged an existing movie, update its position
            const { id, title, genre, duration } = draggedData;
            const updatedMovie = {
                id,
                title,
                genre,
                duration,
                date: dayFullDate,
                time: slotTime,
                hall: hallName,
            };
            // Check if the movie's position actually changed before updating
            const originalMovie = movies.find(m => m.id === id);
            if (originalMovie && originalMovie.date === dayFullDate && originalMovie.hall === hallName && originalMovie.time === slotTime) {
                // No change in position, do nothing
                return;
            }
            await handleSaveMovie(updatedMovie); // Update existing movie in Firestore
        } else if (draggedData && draggedData.type === 'new') {
            // Dragged a new movie from the quick add menu
            const { title, genre, duration } = draggedData.movie;
            const newPredefinedMovie = {
                title,
                genre,
                duration,
                date: dayFullDate,
                time: slotTime,
                hall: hallName,
            };
            await handleSaveMovie(newPredefinedMovie);
        }
        dragMovieRef.current = null; // Clear ref
    };

    // --- Quick Add Dropdown Handler ---
    const handlePredefinedMovieForQuickAddChange = (e) => {
        setSelectedPredefinedMovieForQuickAdd(e.target.value);
    };

    const handleOpenMovieModal = () => {
        setMovieDataForModal(null); // Clear data for new movie
        setShowMovieModal(true); // Open empty modal
        setMessage('');
    };

    const handleCellDoubleClick = async (dayFullDate, hallName, slotTime) => {
        setMessage(''); // Clear any previous messages

        const selectedMovie = predefinedMovies.find(m => m.title === selectedPredefinedMovieForQuickAdd);

        if (selectedMovie && selectedMovie.title !== 'Kies een film...') {
            // Quick add with predefined movie
            const newMovie = {
                title: selectedMovie.title,
                genre: selectedMovie.genre,
                duration: selectedMovie.duration,
                date: dayFullDate,
                time: slotTime,
                hall: hallName,
            };
            await handleSaveMovie(newMovie); // Add directly
        } else {
            // Open modal for manual input or selection
            setMovieDataForModal({ date: dayFullDate, time: slotTime, hall: hallName });
            setShowMovieModal(true);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 text-white font-inter flex flex-col items-center">
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

            <style>
                {`
                body { font-family: 'Inter', sans-serif; }
                .fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .schedule-grid-container {
                    overflow-x: auto;
                    width: 100%;
                    flex-grow: 1; /* Allow to take available vertical space */
                }
                .schedule-grid {
                    display: grid;
                    grid-template-columns: 120px repeat(${timeSlots.length}, minmax(40px, 1fr));
                    min-width: calc(120px + ${timeSlots.length} * 40px); /* Ensure minimum width for scrolling */
                }
                .grid-header, .grid-cell {
                    padding: 2px;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    box-sizing: border-box;
                    min-height: 30px;
                    font-size: 0.7rem;
                }
                .grid-header {
                    background-color: rgba(139, 92, 246, 0.4);
                    font-weight: bold;
                    border-bottom: 1px solid rgba(139, 92, 246, 0.6);
                    border-right: 1px solid rgba(139, 92, 246, 0.6);
                }
                .day-row-header {
                    background-color: rgba(109, 40, 217, 0.7);
                    color: white;
                    font-weight: bold;
                    text-align: left;
                    padding-left: 8px;
                    grid-column: 1 / -1;
                    border-bottom: 2px solid rgba(139, 92, 246, 0.8);
                    border-top: 2px solid rgba(139, 92, 246, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    min-height: 35px;
                    font-size: 0.9rem;
                    z-index: 5;
                }
                .grid-cell {
                    background-color: rgba(167, 139, 250, 0.1);
                    border-bottom: 1px solid rgba(139, 92, 246, 0.3);
                    border-right: 1px solid rgba(139, 92, 246, 0.3);
                    position: relative;
                    cursor: pointer;
                }
                .grid-cell.drag-over {
                    border: 2px dashed #a78bfa; /* Example: purple dashed border */
                    background-color: rgba(167, 139, 250, 0.25); /* Slightly darker on drag-over */
                }
                .movie-card {
                    background-color: rgba(79, 70, 229, 0.9);
                    border-radius: 4px;
                    padding: 2px;
                    margin: 0;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.1s ease-in-out;
                    z-index: 2;
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    overflow: hidden;
                    height: 100%;
                    width: 100%;
                    border: 1px solid rgba(139, 92, 246, 0.5);
                }
                .movie-card:hover {
                    transform: translateY(-1px) scale(1.01);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.25);
                }
                .movie-card .movie-info {
                    display: flex;
                    align-items: baseline;
                    flex-grow: 1;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
                .movie-card p.movie-time {
                    font-weight: bold;
                    font-size: 0.75rem;
                    color: #fff;
                    margin-right: 4px;
                    line-height: 1;
                    flex-shrink: 0;
                }
                .movie-card h4.movie-title {
                    font-weight: normal;
                    font-size: 0.75rem;
                    color: #e0e7ff;
                    line-height: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    flex-grow: 1;
                }
                .movie-card button {
                    flex-shrink: 0;
                    margin-left: 4px;
                    padding: 2px 4px;
                    border-radius: 4px;
                    background-color: rgba(239, 68, 68, 0.7);
                    font-size: 0.65rem;
                }
                .movie-card button:hover {
                    background-color: rgba(239, 68, 68, 1);
                }
                .sticky-col {
                    position: sticky;
                    left: 0;
                    z-index: 10;
                    background-color: rgba(139, 92, 246, 0.7);
                }
                .sticky-header {
                    position: sticky;
                    top: 0;
                    z-index: 15;
                    background-color: rgba(139, 92, 246, 0.7);
                }
                .animate-fade-in {
                    animation: fadeInModal 0.3s ease-out forwards;
                }
                @keyframes fadeInModal {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .draggable-movie-preview {
                    /* Adjusted styling for menu bar */
                    background-color: rgba(79, 70, 229, 0.9);
                    border-radius: 0.375rem; /* rounded-md */
                    padding: 0.5rem 1rem; /* py-2 px-4 */
                    color: white;
                    font-size: 0.9rem;
                    cursor: grab;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); /* shadow-md */
                    text-align: center;
                    margin-bottom: 0; /* Remove bottom margin */
                    display: inline-flex; /* Use flex for internal alignment */
                    align-items: center;
                    justify-content: center;
                    white-space: nowrap; /* Prevent wrapping */
                    flex-shrink: 0; /* Prevent shrinking in flex container */
                }
                .draggable-movie-preview:active {
                    cursor: grabbing;
                }
                /* Main app container to allow flex growth */
                .app-container {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    width: 100%; /* Ensure it takes full width */
                }
                /* Content wrapper below menu bar */
                .main-content {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1rem 1.5rem 2rem 1.5rem; /* p-4 sm:p-6 lg:p-8, keep the padding */
                }

                /* Ensure the scheduler takes almost full width */
                .scheduler-wrapper {
                    background-color: rgba(139, 92, 246, 0.7); /* purple-700 with opacity */
                    padding: 1.5rem; /* p-6 */
                    border-radius: 0.75rem; /* rounded-xl */
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.04); /* shadow-2xl */
                    width: calc(100vw - 3rem); /* Almost full viewport width minus side padding */
                    max-width: none; /* Override max-w from Tailwind */
                }

                /* Adjust margin top for main content if sticky header is used */
                .main-content {
                    margin-top: 0; /* No explicit margin-top, managed by sticky behavior */
                }
                `}
            </style>

            <div className="app-container">
                {/* Menu Bar */}
                <MenuBar
                    selectedPredefinedMovieForQuickAdd={selectedPredefinedMovieForQuickAdd}
                    handlePredefinedMovieForQuickAddChange={handlePredefinedMovieForQuickAddChange}
                    handleDragStart={handleDragStart}
                    handleOpenMovieModal={handleOpenMovieModal}
                    predefinedMovies={predefinedMovies}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    viewMode={viewMode}
                    toggleViewMode={toggleViewMode}
                />

                <div className="main-content">
                    {userId && (
                        <div className="bg-purple-700 bg-opacity-70 rounded-lg p-3 mb-6 text-sm text-center shadow-lg">
                            <p>Jouw gebruikers-ID: <span className="font-mono break-all">{userId}</span></p>
                        </div>
                    )}

                    {message && (
                        <div className="bg-yellow-400 text-purple-900 p-3 rounded-md mb-6 w-full max-w-lg text-center shadow-md animate-bounce-in">
                            {message}
                        </div>
                    )}

                    {/* Custom Confirmation Dialog */}
                    {showConfirm && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                            <div className="bg-white text-gray-900 p-6 rounded-lg shadow-xl max-w-sm w-full">
                                <p className="text-lg font-semibold mb-6 text-center">{confirmMessage}</p>
                                <div className="flex justify-around space-x-4">
                                    <button
                                        onClick={() => handleConfirm(true)}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                                    >
                                        Ja
                                    </button>
                                    <button
                                        onClick={() => handleConfirm(false)}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition-all duration-200"
                                    >
                                        Annuleren
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Movie Management Modal */}
                    <MovieModal
                        show={showMovieModal}
                        onClose={() => setShowMovieModal(false)}
                        movieData={movieDataForModal}
                        onSave={handleSaveMovie}
                        predefinedMovies={predefinedMovies}
                        halls={halls}
                        message={message}
                        clearMessage={() => setMessage('')}
                    />

                    {/* Conditional rendering based on currentPage */}
                    {currentPage === 'programming' && (
                        <div className="scheduler-wrapper">
                            <h2 className="text-2xl font-semibold mb-5 text-center">Weekprogramma</h2>

                            {/* Week Navigation */}
                            <div className="flex justify-between items-center mb-4 px-2">
                                <button
                                    onClick={goToPreviousWeek}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition-all duration-200 shadow-md"
                                >
                                    &larr; Vorige week
                                </button>
                                <span className="text-xl font-semibold text-center">
                                    {new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(currentWeekStart)}
                                    {' - '}
                                    {new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(daysOfWeek[6].fullDate ? parseDate(daysOfWeek[6].fullDate) : new Date())}
                                </span>
                                <button
                                    onClick={goToNextWeek}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition-all duration-200 shadow-md"
                                >
                                    Volgende week &rarr;
                                </button>
                            </div>
                            <div className="text-center mb-4">
                                <button
                                    onClick={goToToday}
                                    className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-5 rounded-lg transition-all duration-200 shadow-md"
                                >
                                    Vandaag
                                </button>
                            </div>

                            <div className="schedule-grid-container">
                                <div className="schedule-grid" style={{ gridTemplateColumns: `120px repeat(${timeSlots.length}, minmax(40px, 1fr))` }}>
                                    {/* Corner Header - Empty for alignment */}
                                    <div className="grid-header sticky-col sticky-header border-r border-b border-purple-600"></div>

                                    {/* Time Headers - Horizontal Time Axis */}
                                    {timeSlots.map(slot => (
                                        <div key={slot} className="grid-header text-xs whitespace-nowrap sticky-header border-b border-purple-600">
                                            {slot}
                                        </div>
                                    ))}

                                    {/* Conditional Rendering based on viewMode */}
                                    {viewMode === 'day' ? ( // Overzicht per dag
                                        daysOfWeek.map((day) => (
                                            <React.Fragment key={day.fullDate}>
                                                {/* Day Header Row - Spanning all columns */}
                                                <div className="day-row-header" style={{ gridColumn: `1 / span ${timeSlots.length + 1}` }}>
                                                    <span className="text-lg">{day.dayName} {day.dayOfMonth}</span>
                                                </div>

                                                {halls.map((hall) => (
                                                    <React.Fragment key={`${day.fullDate}-${hall}`}>
                                                        {/* Hall Label Column - Sticky */}
                                                        <div className="grid-cell sticky-col border-r border-b border-purple-600 text-left font-semibold text-sm justify-center">
                                                            <div className="text-purple-300 text-base">{hall}</div>
                                                        </div>

                                                        {/* Movie Cells for each time slot */}
                                                        {timeSlots.map((slot, slotIndex) => {
                                                            const cellContent = currentWeekSchedule[hall]?.[day.fullDate]?.[slotIndex];

                                                            if (cellContent && cellContent !== 'SPANNED') { // A movie starts here
                                                                const movie = cellContent;
                                                                return (
                                                                    <div
                                                                        key={movie.id}
                                                                        className="movie-card fade-in"
                                                                        onClick={() => handleEditMovie(movie)}
                                                                        draggable="true" // Make existing movies draggable
                                                                        onDragStart={(e) => handleDragStart(e, movie)}
                                                                        style={{
                                                                            gridColumnStart: slotIndex + 2,
                                                                            gridColumnEnd: `span ${movie.spanSlots}`,
                                                                        }}
                                                                    >
                                                                        <div className="movie-info">
                                                                            <p className="movie-time">{movie.time}</p>
                                                                            <h4 className="movie-title">{movie.title}</h4>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteMovie(movie.id); }}
                                                                            className="text-red-300 hover:text-red-100 text-xs transition-colors duration-200"
                                                                        >
                                                                            X
                                                                        </button>
                                                                    </div>
                                                                );
                                                            } else if (cellContent === 'SPANNED') { // This slot is part of a movie's duration, already rendered
                                                                return null; // Do not render a separate cell
                                                            } else { // Empty cell
                                                                return (
                                                                    <div
                                                                        key={`${hall}-${day.fullDate}-${slot}`}
                                                                        className="grid-cell border-b border-purple-600 border-r"
                                                                        onDoubleClick={() => handleCellDoubleClick(day.fullDate, hall, slot)}
                                                                        onDragOver={handleDragOver}
                                                                        onDrop={(e) => handleDrop(e, day.fullDate, hall, slot)}
                                                                        onDragEnter={handleDragEnter} // Added for visual feedback
                                                                        onDragLeave={handleDragLeave} // Added for visual feedback
                                                                    >
                                                                        {/* Empty cell for double click or drop */}
                                                                    </div>
                                                                );
                                                            }
                                                        })}
                                                    </React.Fragment>
                                                ))}
                                            </React.Fragment>
                                        ))
                                    ) : ( // Overzicht per zaal (nieuwe standaard weergave)
                                        halls.map((hall) => (
                                            <React.Fragment key={hall}>
                                                {/* Hall Header Row - Spanning all columns */}
                                                <div className="day-row-header" style={{ gridColumn: `1 / span ${timeSlots.length + 1}` }}>
                                                    <span className="text-lg">{hall}</span> {/* Hall name as header */}
                                                </div>
                                                {daysOfWeek.map((day) => (
                                                    <React.Fragment key={`${hall}-${day.fullDate}`}>
                                                        {/* Day Label Column - Sticky */}
                                                        <div className="grid-cell sticky-col border-r border-b border-purple-600 text-left font-semibold text-sm justify-center">
                                                            <div className="text-purple-300 text-base">{day.dayName} {day.dayOfMonth}</div> {/* Day name as sub-header */}
                                                        </div>
                                                        {timeSlots.map((slot, slotIndex) => {
                                                            const cellContent = currentWeekSchedule[hall]?.[day.fullDate]?.[slotIndex];

                                                            if (cellContent && cellContent !== 'SPANNED') { // A movie starts here
                                                                const movie = cellContent;
                                                                return (
                                                                    <div
                                                                        key={movie.id}
                                                                        className="movie-card fade-in"
                                                                        onClick={() => handleEditMovie(movie)}
                                                                        draggable="true" // Make existing movies draggable
                                                                        onDragStart={(e) => handleDragStart(e, movie)}
                                                                        style={{
                                                                            gridColumnStart: slotIndex + 2,
                                                                            gridColumnEnd: `span ${movie.spanSlots}`,
                                                                        }}
                                                                    >
                                                                        <div className="movie-info">
                                                                            <p className="movie-time">{movie.time}</p>
                                                                            <h4 className="movie-title">{movie.title}</h4>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteMovie(movie.id); }}
                                                                            className="text-red-300 hover:text-red-100 text-xs transition-colors duration-200"
                                                                        >
                                                                            X
                                                                        </button>
                                                                    </div>
                                                                );
                                                            } else if (cellContent === 'SPANNED') {
                                                                return null;
                                                            } else {
                                                                return (
                                                                    <div
                                                                        key={`${hall}-${day.fullDate}-${slot}`}
                                                                        className="grid-cell border-b border-purple-600 border-r"
                                                                        onDoubleClick={() => handleCellDoubleClick(day.fullDate, hall, slot)}
                                                                        onDragOver={handleDragOver}
                                                                        onDrop={(e) => handleDrop(e, day.fullDate, hall, slot)}
                                                                        onDragEnter={handleDragEnter}
                                                                        onDragLeave={handleDragLeave}
                                                                    >
                                                                    </div>
                                                                );
                                                            }
                                                        })}
                                                    </React.Fragment>
                                                ))}
                                            </React.Fragment>
                                        ))
                                    )}
                                </div> {/* End of schedule-grid */}
                            </div> {/* End of schedule-grid-container */}
                        </div> /* End of scheduler-wrapper */
                    )}

                    {currentPage === 'movieManagement' && (
                        <MovieManagementPage
                            movies={movies}
                            handleEditMovie={handleEditMovie}
                            handleDeleteMovie={handleDeleteMovie}
                        />
                    )}

                    {currentPage === 'settings' && (
                        <SettingsPage />
                    )}

                </div> {/* End of main-content */}
            </div> {/* End of app-container */}
        </div> // Final closing div for the entire component
    );
}

export default App;
