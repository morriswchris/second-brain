import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ApiKeyForm } from '@/components/api-key-form';

async function typeKey(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Anthropic API key'), text);
  });
}

async function pressSave() {
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Save API key'));
  });
}

describe('ApiKeyForm', () => {
  it('saves the entered key and clears the field', async () => {
    const onSave = jest.fn(async () => {});
    await render(<ApiKeyForm onSave={onSave} />);

    await typeKey('sk-ant-test');
    await pressSave();

    expect(onSave).toHaveBeenCalledWith('sk-ant-test');
    expect(screen.getByLabelText('Anthropic API key').props.value).toBe('');
  });

  it('does not save an empty key', async () => {
    const onSave = jest.fn(async () => {});
    await render(<ApiKeyForm onSave={onSave} />);

    await typeKey('   ');
    await pressSave();

    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows an error when saving fails', async () => {
    const onSave = jest.fn(async () => {
      throw new Error('keychain unavailable');
    });
    await render(<ApiKeyForm onSave={onSave} />);

    await typeKey('sk-ant-test');
    await pressSave();

    expect(screen.getByText('Couldn’t save the key on this device. Try again.')).toBeOnTheScreen();
  });
});
