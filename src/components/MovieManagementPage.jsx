import React from 'react';
import PropTypes from 'prop-types';

function MovieManagementPage({ movies, handleEditMovie, handleDeleteMovie }) {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-5 text-center">Filmbeheer</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Titel
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duur
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acties
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {movies.map((movie) => (
                            <tr key={movie.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {movie.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {movie.duration} min
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEditMovie(movie)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Bewerken
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMovie(movie.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Verwijderen
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

MovieManagementPage.propTypes = {
    movies: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            duration: PropTypes.number.isRequired
        })
    ).isRequired,
    handleEditMovie: PropTypes.func.isRequired,
    handleDeleteMovie: PropTypes.func.isRequired
};

export default MovieManagementPage;
