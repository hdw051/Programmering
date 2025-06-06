import React from 'react';
import PropTypes from 'prop-types';

function MenuBar({
    selectedPredefinedMovieForQuickAdd,
    handlePredefinedMovieForQuickAddChange,
    predefinedMovies
}) {
    return (
        <div className="bg-purple-800 text-white w-full py-3 px-6 shadow-xl flex flex-col sm:flex-row items-center justify-between sticky top-0 z-20">
            <h1 className="text-xl font-bold mb-2 sm:mb-0 mr-4">Bioscoop Planner</h1>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                <select
                    value={selectedPredefinedMovieForQuickAdd}
                    onChange={handlePredefinedMovieForQuickAddChange}
                    className="p-2 rounded-md bg-purple-700 border border-purple-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 appearance-none flex-grow"
                >
                    {predefinedMovies.map((movie) => (
                        <option key={movie.title} value={movie.title}>
                            {movie.title} {movie.duration ? `(${movie.duration} min)` : ''}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

MenuBar.propTypes = {
    selectedPredefinedMovieForQuickAdd: PropTypes.string.isRequired,
    handlePredefinedMovieForQuickAddChange: PropTypes.func.isRequired,
    predefinedMovies: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            duration: PropTypes.number.isRequired
        })
    ).isRequired
};

export default MenuBar;
