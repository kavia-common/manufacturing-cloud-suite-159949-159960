import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import QualityInspectionList from '../components/QualityInspectionList';
import { createNonconformance, executeInspection, getInspections } from '../api/mes';

// PUBLIC_INTERFACE
/**
 * Quality module:
 * - Execute inspections
 * - Raise nonconformances
 */
const Quality: React.FC = () => {
  const { data, refetch } = useQuery({
    queryKey: ['inspections', 'due'],
    queryFn: () => getInspections('due'),
  });

  const onExecute = async (id: string, input: any) => {
    await executeInspection(id, input);
    await refetch();
  };

  const onRaiseNC = async (input: any) => {
    await createNonconformance(input);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quality
      </Typography>
      <Stack spacing={2}>
        <QualityInspectionList inspections={data || []} onExecute={onExecute} onRaiseNC={onRaiseNC} />
      </Stack>
    </Box>
  );
};

export default Quality;
