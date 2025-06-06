import React from 'react';

function SettingsPage() {
    return (
        <div className="bg-purple-700 bg-opacity-70 p-6 rounded-xl shadow-2xl w-full max-w-5xl lg:max-w-7xl">
            <h2 className="text-2xl font-semibold mb-5 text-center">Instellingen</h2>
            <p className="text-lg">Hier komen de instellingen van de applicatie.</p>
            {/* Future settings like changing start/end hours, default view, etc. */}
        </div>
    );
}

export default SettingsPage;
