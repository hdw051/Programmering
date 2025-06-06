import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../utils/dateUtils';
import { halls, predefinedMovies } from '../constants/movies';

function MovieModal({
    show,
    onClose,
    movieData,
    onSave,
    message,
    clearMessage
}) {
    const [formData, setFormData] = useState({
        title: '',
        time: '',
        duration: '',
        hall: '',
        date: '',
        genre: ''
    });
    const [selectedPredefinedMovie, setSelectedPredefinedMovie] = useState('');
    const [internalMessage, setInternalMessage] = useState('');

    useEffect(() => {
        if (show) {
            setFormData({
                title: movieData?.title || '',
                time: movieData?.time || '',
                duration: movieData?.duration || '',
                hall: movieData?.hall || '',
                date: movieData?.date || formatDate(new Date()),
                genre: movieData?.genre || ''
            });
            setSelectedPredefinedMovie('');
            setInternalMessage('');
        }
    }, [show, movieData]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.time || !formData.date || !formData.hall || !formData.duration) {
            setInternalMessage('Vul alle verplichte velden in');
            return;
        }
        const movie = {
            id: movieData?.id || Date.now().toString(),
            title: formData.title,
            time: formData.time,
            genre: formData.genre,
            date: formData.date,
            duration: parseInt(formData.duration, 10),
            hall: formData.hall
        };
        onSave(movie);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePredefinedMovieSelect = (e) => {
        const selectedMovie = predefinedMovies.find(m => m.title === e.target.value);
        if (selectedMovie) {
            setFormData(prev => ({
                ...prev,
                title: selectedMovie.title,
                duration: selectedMovie.duration,
                genre: selectedMovie.genre
            }));
            setSelectedPredefinedMovie(selectedMovie.title);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    {movieData ? 'Film bewerken' : 'Nieuwe film toevoegen'}
                </h2>
                
                {internalMessage && (
                    <div className="mb-4 p-2 bg-red-500 text-white rounded">
                        {internalMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Film selecteren
                        </label>
                        <select
                            value={selectedPredefinedMovie}
                            onChange={handlePredefinedMovieSelect}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Titel
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tijd
                        </label>
                        <input
                            type="time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duur (minuten)
                        </label>
                        <input
                            type="number"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Zaal
                        </label>
                        <select
                            name="hall"
                            value={formData.hall}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        >
                            <option value="">Selecteer een zaal</option>
                            {halls.map((hall) => (
                                <option key={hall} value={hall}>
                                    {hall}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Datum
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Genre
                        </label>
                        <input
                            type="text"
                            name="genre"
                            value={formData.genre}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors duration-200"
                        >
                            Annuleren
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200"
                        >
                            {movieData ? 'Opslaan' : 'Toevoegen'}
                        </button>
                    </div>
                </form>
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
        hall: PropTypes.string
    }),
    onSave: PropTypes.func.isRequired,
    message: PropTypes.string,
    clearMessage: PropTypes.func.isRequired
};

export default MovieModal;
