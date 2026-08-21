import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { CaptureInput } from '@/components/capture-input';

// React 19 + RNTL v14 defer state updates from events, so interactions that
// depend on a re-render (here: the field value driving the Capture button's
// enabled state) must be flushed inside an async `act`.
async function type(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText("What's on your mind?"), text);
  });
}

async function pressCapture() {
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Capture thought'));
  });
}

describe('CaptureInput', () => {
  it('captures typed text and clears the field', async () => {
    const onCapture = jest.fn();
    await render(<CaptureInput onCapture={onCapture} />);

    await type('remember to stretch');
    await pressCapture();

    expect(onCapture).toHaveBeenCalledWith('remember to stretch');
    expect(screen.getByPlaceholderText("What's on your mind?").props.value).toBe('');
  });

  it('does not capture blank input', async () => {
    const onCapture = jest.fn();
    await render(<CaptureInput onCapture={onCapture} />);

    await type('   ');
    await pressCapture();

    expect(onCapture).not.toHaveBeenCalled();
  });
});
