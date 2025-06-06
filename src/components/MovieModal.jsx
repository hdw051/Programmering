import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils';

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
            const currentTitle = movieData?.title || '';
            setTitle(currentTitle);
            setTime(movieData?.time || '');
            setGenre(movieData?.genre || '');
            setDate(movieData?.date || formatDate(new Date()));
            setDuration(String(movieData?.duration || ''));
            setSelectedHall(movieData?.hall || halls[0]);
            setSelectedPredefinedMovie(currentTitle);
            setInternalMessage(message);
        }
    }, [show, movieData, halls, message]);

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
        const movie = predefinedMovies.find((m) => m.title === selectedTitle);
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
            hall: selectedHall,
        });
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
                        {predefinedMovies.map((movie) => (
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
                        {halls.map((hallName) => (
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

export default MovieModal;
