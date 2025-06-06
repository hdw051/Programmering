import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../utils/dateUtils';

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
    const [features, setFeatures] = useState({ NL: false, OV: false, "2D": false, "3D": false });

    useEffect(() => {
        if (show) {
            const currentTitle = movieData?.title || '';
            setTitle(currentTitle);
            setTime(movieData?.time || '');
            setGenre(movieData?.genre || '');
            setDate(movieData?.date || formatDate(new Date()));
            setDuration(movieData?.duration || '');
            setSelectedHall(movieData?.hall || halls[0]);
            setSelectedPredefinedMovie(currentTitle);
            setInternalMessage(message);
            setFeatures(movieData?.features || { NL: false, OV: false, "2D": false, "3D": false });
        }
    }, [show, movieData, halls, message]);

    useEffect(() => {
        if (message) {
            setInternalMessage(message);
            const timer = setTimeout(() => {
                setInternalMessage('');
                clearMessage();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, clearMessage]);

    const handlePredefinedMovieChange = (e) => {
        const selectedMovie = predefinedMovies.find(movie => movie.title === e.target.value);
        if (selectedMovie) {
            setTitle(selectedMovie.title);
            setGenre(selectedMovie.genre);
            setDuration(selectedMovie.duration);
        }
        setSelectedPredefinedMovie(e.target.value);
    };

    const handleSubmit = () => {
        if (!title || !time || !date || !selectedHall || !duration) {
            setInternalMessage('Vul alle verplichte velden in');
            return;
        }

        const movie = {
            id: movieData?.id || Date.now().toString(),
            title,
            time,
            genre,
            date,
            duration: parseInt(duration, 10),
            hall: selectedHall,
            features
        };

        onSave(movie);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-purple-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-white">
                    {movieData ? 'Film bewerken' : 'Nieuwe film toevoegen'}
                </h2>
                
                {internalMessage && (
                    <div className="mb-4 p-2 bg-red-500 text-white rounded">
                        {internalMessage}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-white mb-1">Film selecteren</label>
                        <select
                            value={selectedPredefinedMovie}
                            onChange={handlePredefinedMovieChange}
                            className="w-full p-2 rounded bg-purple-700 text-white border border-purple-500"
                        >
                            <option value="">Kies een film...</option>
                            {predefinedMovies.map((movie) => (
                                <option key={movie.title} value={movie.title}>
                                    {movie.title} {movie.duration ? `(${movie.duration} min)` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-white mb-1">Titel *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 rounded bg-purple-700 text-white border border-purple-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-white mb-1">Tijd *</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full p-2 rounded bg-purple-700 text-white border border-purple-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-white mb-1">Datum *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2 rounded bg-purple-700 text-white border border-purple-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-white mb-1">Genre</label>
                        <input
                            type="text"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            className="w-full p-2 rounded bg-purple-700 text-white border border-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-white mb-1">Duur (minuten) *</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full p-2 rounded bg-purple-700 text-white border border-purple-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-white mb-1">Zaal *</label>
                        <select
                            value={selectedHall}
                            onChange={(e) => setSelectedHall(e.target.value)}
                            className="w-full p-2 rounded bg-purple-700 text-white border border-purple-500"
                            required
                        >
                            {halls.map((hall) => (
                                <option key={hall} value={hall}>
                                    {hall}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-white mb-1">Features</label>
                        <div className="flex flex-wrap gap-4">
                            {['NL', 'OV', '2D', '3D'].map((feature) => (
                                <label key={feature} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={features[feature]}
                                        onChange={(e) => setFeatures(prev => ({
                                            ...prev,
                                            [feature]: e.target.checked
                                        }))}
                                        className="w-4 h-4 rounded border-purple-500"
                                    />
                                    <span className="text-white">{feature}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Annuleren
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                        {movieData ? 'Bewerken' : 'Toevoegen'}
                    </button>
                </div>
            </div>
        </div>
    );
}

MovieModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    movieData: PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        time: PropTypes.string,
        genre: PropTypes.string,
        date: PropTypes.string,
        duration: PropTypes.number,
        hall: PropTypes.string,
        features: PropTypes.shape({
            NL: PropTypes.bool,
            OV: PropTypes.bool,
            "2D": PropTypes.bool,
            "3D": PropTypes.bool
        })
    }),
    onSave: PropTypes.func.isRequired,
    predefinedMovies: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            genre: PropTypes.string.isRequired,
            duration: PropTypes.number.isRequired
        })
    ).isRequired,
    halls: PropTypes.arrayOf(PropTypes.string).isRequired,
    message: PropTypes.string,
    clearMessage: PropTypes.func.isRequired
};

export default MovieModal;
