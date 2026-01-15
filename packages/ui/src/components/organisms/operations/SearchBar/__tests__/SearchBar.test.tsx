import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with placeholder', () => {
    render(<SearchBar {...defaultProps} placeholder="Search items..." />);

    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<SearchBar {...defaultProps} value="test query" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test query');
  });

  it('calls onChange when input value changes', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('new value');
  });

  it('shows clear button when value is not empty', () => {
    render(<SearchBar {...defaultProps} value="test" />);

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('does not show clear button when value is empty', () => {
    render(<SearchBar {...defaultProps} value="" />);

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('clears value when clear button is clicked', () => {
    render(<SearchBar {...defaultProps} value="test" />);

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(defaultProps.onChange).toHaveBeenCalledWith('');
  });

  it('shows keyboard shortcut hint when provided', () => {
    render(<SearchBar {...defaultProps} shortcutHint="⌘K" />);

    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<SearchBar {...defaultProps} disabled={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('is autofocused when autoFocus is true', () => {
    render(<SearchBar {...defaultProps} autoFocus={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveFocus();
  });

  it('renders recent searches dropdown when showRecent is true', () => {
    render(
      <SearchBar
        {...defaultProps}
        recentSearches={['Search 1', 'Search 2']}
        showRecent={true}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    expect(screen.getByText('Search 1')).toBeInTheDocument();
    expect(screen.getByText('Search 2')).toBeInTheDocument();
  });

  it('calls onSelectRecent when recent search is clicked', () => {
    const onSelectRecent = jest.fn();

    render(
      <SearchBar
        {...defaultProps}
        recentSearches={['Search 1']}
        onSelectRecent={onSelectRecent}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    const recentItem = screen.getByText('Search 1');
    fireEvent.click(recentItem);

    expect(onSelectRecent).toHaveBeenCalledWith('Search 1');
  });

  it('calls onClearRecent when clear button in dropdown is clicked', () => {
    const onClearRecent = jest.fn();

    render(
      <SearchBar
        {...defaultProps}
        recentSearches={['Search 1']}
        onClearRecent={onClearRecent}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(onClearRecent).toHaveBeenCalledTimes(1);
  });

  it('clears value when Escape is pressed and input has value', () => {
    render(<SearchBar {...defaultProps} value="test" />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(defaultProps.onChange).toHaveBeenCalledWith('');
  });
});
