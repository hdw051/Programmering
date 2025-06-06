import React from 'react';

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
                {currentPage === 'programming' && (
                    <>
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
                {currentPage === 'programming' && (
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

export default MenuBar;
