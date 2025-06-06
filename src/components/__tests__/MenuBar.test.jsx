import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuBar from '../MenuBar';
import { predefinedMovies } from '../../constants/movies';

describe('MenuBar', () => {
    const defaultProps = {
        selectedPredefinedMovieForQuickAdd: '',
        handlePredefinedMovieForQuickAddChange: jest.fn(),
        handleDragStart: jest.fn(),
        handleOpenMovieModal: jest.fn(),
        predefinedMovies,
        currentPage: 'programming',
        setCurrentPage: jest.fn(),
        viewMode: 'hall',
        toggleViewMode: jest.fn()
    };

    it('renders the application title', () => {
        render(<MenuBar {...defaultProps} />);
        expect(screen.getByText('Bioscoop Planner')).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
        render(<MenuBar {...defaultProps} />);
        expect(screen.getByText('Programmering')).toBeInTheDocument();
        expect(screen.getByText('Filmbeheer')).toBeInTheDocument();
        expect(screen.getByText('Instellingen')).toBeInTheDocument();
    });

    it('calls setCurrentPage when navigation buttons are clicked', () => {
        render(<MenuBar {...defaultProps} />);
        fireEvent.click(screen.getByText('Filmbeheer'));
        expect(defaultProps.setCurrentPage).toHaveBeenCalledWith('movieManagement');
    });

    it('renders movie selection dropdown when on programming page', () => {
        render(<MenuBar {...defaultProps} />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('calls handleOpenMovieModal when add movie button is clicked', () => {
        render(<MenuBar {...defaultProps} />);
        fireEvent.click(screen.getByText('Film handmatig toevoegen'));
        expect(defaultProps.handleOpenMovieModal).toHaveBeenCalled();
    });
}); 