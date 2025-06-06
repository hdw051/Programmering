import React from 'react';

function MovieManagementPage({ movies, handleEditMovie, handleDeleteMovie }) {
    return (
        <div className="bg-purple-700 bg-opacity-70 p-6 rounded-xl shadow-2xl w-full max-w-5xl lg:max-w-7xl">
            <h2 className="text-2xl font-semibold mb-5 text-center">Filmbeheer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movies.length > 0 ? (
                    movies.map((movie) => (
                        <div key={movie.id} className="bg-purple-800 p-4 rounded-lg shadow-md flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold mb-2">{movie.title}</h3>
                                <p className="text-purple-300 text-sm mb-2">Duur: {movie.duration} min</p>
                                <div className="flex gap-2 mb-2">
                                    {movie.features && Object.keys(movie.features).filter(f => movie.features[f]).map(f => (
                                        <span key={f} className="bg-purple-600 px-2 py-0.5 rounded text-xs">{f}</span>
                                    ))}
                                </div>
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

export default MovieManagementPage;
