import React from 'react';
import PropTypes from 'prop-types';

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
        <div className="bg-purple-800 text-white w-full py-1 px-2 shadow-xl flex flex-col sm:flex-row items-center justify-between sticky top-0 z-20 text-sm">
            <h1 className="text-base font-bold mb-1 sm:mb-0 mr-2">Bioscoop Planner</h1>
            <nav className="flex gap-2 mb-1 sm:mb-0">
                <button
                    onClick={() => setCurrentPage('programming')}
                    className={`px-3 py-1 rounded-md transition-colors duration-200 ${currentPage === 'programming' ? 'bg-indigo-600' : 'bg-purple-700 hover:bg-purple-600'}`}
                >
                    Programmering
                </button>
                <button
                    onClick={() => setCurrentPage('movieManagement')}
                    className={`px-3 py-1 rounded-md transition-colors duration-200 ${currentPage === 'movieManagement' ? 'bg-indigo-600' : 'bg-purple-700 hover:bg-purple-600'}`}
                >
                    Filmbeheer
                </button>
                <button
                    onClick={() => setCurrentPage('settings')}
                    className={`px-3 py-1 rounded-md transition-colors duration-200 ${currentPage === 'settings' ? 'bg-indigo-600' : 'bg-purple-700 hover:bg-purple-600'}`}
                >
                    Instellingen
                </button>
            </nav>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                {currentPage === 'programming' && (
                    <>
                        <select
                            value={selectedPredefinedMovieForQuickAdd}
                            onChange={handlePredefinedMovieForQuickAddChange}
                            className="p-1 rounded-md bg-purple-700 border border-purple-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 appearance-none flex-grow text-sm"
                        >
                            {predefinedMovies.map((movie) => (
                                <option key={movie.title} value={movie.title}>
                                    {movie.title} {movie.duration ? `(${movie.duration} min)` : ''}
                                </option>
                            ))}
                        </select>

                        {selectedPredefinedMovieForQuickAdd && selectedPredefinedMovieForQuickAdd !== 'Kies een film...' && (
                            <div
                                className="draggable-movie-preview px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-grab transition-colors duration-200 shadow-md text-sm"
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
                    className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold rounded-md transition-all duration-300 transform hover:scale-105 shadow-md flex-shrink-0 text-sm"
                >
                    Film handmatig toevoegen
                </button>
                {currentPage === 'programming' && (
                    <button
                        onClick={toggleViewMode}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-md transition-all duration-300 transform hover:scale-105 shadow-md flex-shrink-0 text-sm"
                    >
                        Schakel naar {viewMode === 'hall' ? 'Overzicht per dag' : 'Overzicht per zaal'}
                    </button>
                )}
            </div>
        </div>
    );
}

MenuBar.propTypes = {
    selectedPredefinedMovieForQuickAdd: PropTypes.string.isRequired,
    handlePredefinedMovieForQuickAddChange: PropTypes.func.isRequired,
    handleDragStart: PropTypes.func.isRequired,
    handleOpenMovieModal: PropTypes.func.isRequired,
    predefinedMovies: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            genre: PropTypes.string.isRequired,
            duration: PropTypes.number.isRequired
        })
    ).isRequired,
    currentPage: PropTypes.string.isRequired,
    setCurrentPage: PropTypes.func.isRequired,
    viewMode: PropTypes.string.isRequired,
    toggleViewMode: PropTypes.func.isRequired
};

export default MenuBar;
