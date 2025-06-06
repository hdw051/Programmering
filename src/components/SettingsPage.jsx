import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

function SettingsPage({
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    message,
    setMessage
}) {
    const handleStartHourChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0 && value <= 23 && value < endHour) {
            setStartHour(value);
            setMessage('Instellingen automatisch opgeslagen!');
        }
    };

    const handleEndHourChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0 && value <= 24 && value > startHour) {
            setEndHour(value);
            setMessage('Instellingen automatisch opgeslagen!');
        }
    };

    useEffect(() => {
        if (message === 'Instellingen automatisch opgeslagen!') {
            const timer = setTimeout(() => {
                setMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, setMessage]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-5 text-center">Instellingen</h2>
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Roostertijden</h3>
                    <div className="flex items-center gap-4">
                        <label className="text-gray-700">Starttijd (uur):</label>
                        <input
                            type="number"
                            value={startHour}
                            onChange={handleStartHourChange}
                            min="0"
                            max="23"
                            className="p-2 border border-gray-300 rounded-md w-20 text-center"
                        />
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <label className="text-gray-700">Eindtijd (uur):</label>
                        <input
                            type="number"
                            value={endHour}
                            onChange={handleEndHourChange}
                            min="1"
                            max="24"
                            className="p-2 border border-gray-300 rounded-md w-20 text-center"
                        />
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Over deze applicatie</h3>
                    <p className="text-gray-600">
                        Deze applicatie is ontwikkeld voor het beheren van de bioscoop programmering.
                        Je kunt films toevoegen, bewerken en verwijderen, en de programmering per zaal bekijken.
                    </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Gebruik</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                        <li>Gebruik de "Film handmatig toevoegen" knop om een nieuwe film toe te voegen</li>
                        <li>Sleep films vanuit de dropdown naar de gewenste tijd en zaal</li>
                        <li>Dubbelklik op een tijdvak om een film toe te voegen</li>
                        <li>Klik op een film om deze te bewerken of te verwijderen</li>
                        <li>Gebruik de navigatieknoppen om door de weken te bladeren</li>
                    </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Contact</h3>
                    <p className="text-gray-600">
                        Voor vragen of problemen, neem contact op met de beheerder.
                    </p>
                </div>
            </div>
        </div>
    );
}

SettingsPage.propTypes = {
    startHour: PropTypes.number.isRequired,
    setStartHour: PropTypes.func.isRequired,
    endHour: PropTypes.number.isRequired,
    setEndHour: PropTypes.func.isRequired,
    message: PropTypes.string,
    setMessage: PropTypes.func.isRequired
};

export default SettingsPage;
