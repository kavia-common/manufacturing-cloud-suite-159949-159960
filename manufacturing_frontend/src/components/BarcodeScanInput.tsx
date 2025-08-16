import React from 'react';
import { Box, TextField, InputAdornment, IconButton } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

// PUBLIC_INTERFACE
export interface BarcodeScanInputProps {
  /** Called when Enter is pressed or when explicit scan submit happens. */
  onDetected: any;
  placeholder?: string;
}

/**
 * Large text input tailored for barcode scanning; autofocus, clears on submit,
 * accessible on mobile with visible action button.
 */
const BarcodeScanInput: React.FC<BarcodeScanInputProps> = ({ onDetected, placeholder }) => {
  const [code, setCode] = React.useState('');

  const submit = React.useCallback(() => {
    const trimmed = code.trim();
    if (!trimmed) return;
    onDetected(trimmed);
    setCode('');
  }, [code, onDetected]);

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        label="Scan barcode"
        placeholder={placeholder || 'Scan WO/traveler/Kanban...'}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        fullWidth
        autoFocus
        inputProps={{ inputMode: 'text' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton edge="end" color="primary" onClick={submit} aria-label="submit-scan">
                <QrCodeScannerIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default BarcodeScanInput;
