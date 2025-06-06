# Bioscoop Planner (Movie Schedule Management System)

A comprehensive web application for managing movie schedules across multiple cinema halls. Built with React and Kendo UI components, this application provides an intuitive interface for planning and managing movie screenings.

## Features

### Core Functionalities
- **Schedule Management**
  - Drag-and-drop interface for movie scheduling
  - Multiple view modes (Hall/Day view)
  - Time slot management
  - Visual schedule grid

- **Movie Management**
  - Add/Edit/Delete movies
  - Movie details tracking (title, duration, genre)
  - Quick-add functionality for frequently used movies
  - Movie library management

- **Hall Management**
  - Multiple cinema halls support
  - Hall capacity tracking
  - Hall-specific scheduling

### Technical Features
- Firebase integration for data persistence
- Responsive design for all screen sizes
- Drag-and-drop functionality
- Real-time updates
- Local storage fallback

## Tech Stack

### Frontend
- React 18
- Kendo UI Components
  - Kendo React Scheduler
  - Kendo React Buttons
  - Kendo React Dropdowns
  - Kendo React Inputs
- Vite (Build tool)
- Firebase (Backend)

### Development Tools
- ESLint (Code linting)
- Prettier (Code formatting)
- Jest (Testing)
- Babel (JavaScript compiler)

## Project Structure

```
src/
├── components/           # React components
│   ├── MenuBar.jsx      # Navigation and controls
│   ├── MovieModal.jsx   # Movie addition/editing interface
│   ├── MovieManagementPage.jsx  # Movie library management
│   └── SettingsPage.jsx # Application settings
├── constants/           # Application constants
│   └── movies.js       # Movie and hall definitions
├── styles/             # CSS styles
│   └── schedule.css    # Schedule grid styling
├── utils/              # Utility functions
│   └── dateUtils.js    # Date manipulation utilities
├── App.jsx            # Main application component
└── index.css          # Global styles
```

## Getting Started

### Prerequisites
- Node.js (Latest LTS version recommended)
- npm (Comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hdw051/Programmering.git
cd Programmering
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The optimized files will be placed in the `dist/` directory.

## Configuration

### Firebase Setup
The application requires Firebase configuration. Add the following to your `index.html`:

```html
<script>
  window.__firebase_config = JSON.stringify({
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
  });
  window.__app_id = 'your-app-id';
</script>
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Best Practices
1. Keep components modular and focused
2. Use responsive units (clamp, vw, vh) for dimensions
3. Maintain consistent color scheme
4. Test on different screen sizes
5. Follow existing naming conventions
6. Document new functions and components

## Known Issues
- The table/scheduler functionality is currently not working as expected
- Some drag-and-drop operations may need refinement
- Responsive design may need adjustments for very small screens

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
ISC License

## Support
For issues and feature requests, please use the [GitHub Issues](https://github.com/hdw051/Programmering/issues) page.

# Movie Schedule Management System

A responsive web application for managing movie schedules across multiple halls and days.

## Project Structure

```
src/
├── components/           # React components
│   ├── MenuBar.jsx      # Main navigation and controls
│   ├── MovieModal.jsx   # Movie addition/editing modal
│   ├── MovieManagementPage.jsx  # Movie management interface
│   └── SettingsPage.jsx # Application settings
├── constants/           # Application constants
│   └── movies.js       # Movie and hall definitions
├── styles/             # CSS styles
│   └── schedule.css    # Schedule grid styling
├── utils/              # Utility functions
│   └── dateUtils.js    # Date manipulation utilities
├── App.jsx            # Main application component
└── index.css          # Global styles
```

## Component Documentation

### App.jsx
Main application component that handles:
- Firebase/local storage integration
- Movie data management
- Schedule grid rendering
- Drag and drop functionality
- State management for the entire application

Key functions:
- `handleSaveMovie`: Saves or updates movie data
- `handleDeleteMovie`: Removes movies from the schedule
- `handleDragStart`: Initiates drag and drop operations
- `handleDrop`: Handles movie placement in the schedule

### MenuBar.jsx
Navigation and control component that provides:
- Page navigation (Programming, Movie Management, Settings)
- Quick-add movie functionality
- View mode switching (Hall/Day view)
- Manual movie addition

Props:
- `selectedPredefinedMovieForQuickAdd`: Currently selected movie for quick add
- `handlePredefinedMovieForQuickAddChange`: Handles movie selection changes
- `handleDragStart`: Initiates drag operations
- `handleOpenMovieModal`: Opens the movie addition modal
- `predefinedMovies`: List of predefined movies
- `currentPage`: Current active page
- `setCurrentPage`: Page navigation function
- `viewMode`: Current view mode
- `toggleViewMode`: View mode switching function

### MovieModal.jsx
Modal component for adding/editing movies with:
- Movie title input
- Duration selection
- Genre selection
- Save/Cancel functionality

### MovieManagementPage.jsx
Interface for managing movie library with:
- List of all movies
- Edit/Delete functionality
- Movie details display

## Styling System

### schedule.css
Main styling file for the schedule grid with the following key sections:

1. **Grid Layout**
```css
.time-headers {
    grid-template-columns: clamp(40px, 5vw, 60px) repeat(60, minmax(clamp(15px, 2vw, 20px), 1fr));
}
```
Controls the time header and slot alignment.

2. **Movie Cards**
```css
.movie-card {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 5;
}
```
Handles movie card positioning and appearance.

3. **Responsive Design**
```css
/* Example of responsive sizing */
height: clamp(20px, 3vh, 24px);
font-size: clamp(0.6rem, 1vw, 0.75rem);
```
Uses CSS clamp() for responsive dimensions.

### Color Scheme
- Primary: `#6d4bc1` (Purple)
- Secondary: `#5a3ea0` (Darker Purple)
- Accent: `#7c5fd6` (Light Purple)
- Text: White on dark backgrounds

## Data Structure

### Movie Object
```javascript
{
    id: string,
    title: string,
    duration: number,
    genre: string,
    startTime: string,
    hall: string,
    day: string
}
```

### Hall Configuration
Defined in `constants/movies.js`:
```javascript
export const halls = [
    { name: "Zaal 1", capacity: 100 },
    { name: "Zaal 2", capacity: 150 },
    // ...
];
```

## Making Changes

### Adding New Features
1. Create new components in `src/components/`
2. Add any new constants to `src/constants/`
3. Create utility functions in `src/utils/` if needed
4. Add styles to appropriate CSS files

### Modifying Existing Features

#### Grid Layout
1. Edit `schedule.css`:
   - Adjust grid template columns in `.time-headers` and `.day-row`
   - Modify time slot dimensions in `.time-slot`
   - Update movie card styling in `.movie-card`

#### Movie Management
1. Modify `MovieModal.jsx` for form changes
2. Update `MovieManagementPage.jsx` for list view changes
3. Adjust `App.jsx` for data handling changes

#### Navigation
1. Update `MenuBar.jsx` for navigation changes
2. Modify related styles in `schedule.css`

### Best Practices
- Keep components modular and focused
- Use responsive units (clamp, vw, vh) for dimensions
- Maintain consistent color scheme
- Test on different screen sizes
- Follow the existing naming conventions
- Document new functions and components

## Dependencies
- React
- Firebase (optional, falls back to localStorage)
- Tailwind CSS (for utility classes)

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Build for production: `npm run build`

## Troubleshooting

### Common Issues
1. **Grid Alignment Issues**
   - Check `schedule.css` grid template columns
   - Verify time slot dimensions
   - Ensure consistent column widths

2. **Movie Card Positioning**
   - Check z-index values
   - Verify absolute positioning
   - Ensure proper parent container

3. **Responsive Design**
   - Test different screen sizes
   - Verify clamp() values
   - Check overflow handling

### Development Tips
1. Use browser dev tools to inspect grid layout
2. Test drag and drop functionality thoroughly
3. Verify data persistence (Firebase/localStorage)
4. Check console for any errors
5. Test on multiple browsers

# Bioscoop Planner

Deze repository bevat de broncode voor een simpele React-applicatie waarmee je filmprogramma's kunt plannen. De applicatie gebruikt Firebase voor opslag en authenticatie. 

## Installatie

1. Zorg dat [Node.js](https://nodejs.org/) is geïnstalleerd.
2. Installeer de dependencies:

```bash
npm install
```

3. Start de ontwikkelserver:

```bash
npm run dev
```

De applicatie is daarna bereikbaar op `http://localhost:3000`.

## Builden voor productie

```bash
npm run build
```
Wanneer je de applicatie op GitHub Pages plaatst, zorg dan dat in `vite.config.js` de optie `base: './'` is ingesteld. Hiermee worden de gebuildde assets vanaf het juiste pad geladen en voorkom je een wit scherm.

De geoptimaliseerde bestanden worden geplaatst in de map `dist/`, waarmee je de app bijvoorbeeld op GitHub Pages kunt hosten.

## Configuratie

De applicatie verwacht enkele globale variabelen voor Firebase-configuratie en authenticatie. Als je deze via een bundler of direct in `index.html` definieert, worden ze gebruikt bij het starten van de app:

```html
<script>
  window.__firebase_config = JSON.stringify({
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  });
  window.__app_id = 'mijn-app-id';
  window.__initial_auth_token = null; // optioneel
</script>
```

Zonder deze configuratie kun je Firebase niet gebruiken en zal de app foutmeldingen tonen.

### Offline gebruik

Wanneer er geen Firebase-configuratie aanwezig is, slaat de applicatie de filmgegevens lokaal op in `localStorage`. Zo kun je de planner ook zonder internetverbinding testen. De gegevens blijven bewaard in de browser totdat je de cache leegt.

