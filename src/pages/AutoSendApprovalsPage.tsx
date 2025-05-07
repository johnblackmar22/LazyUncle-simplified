import React from 'react';
import { Box, Container, Heading, Button } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import PendingAutoSendApprovals from '../components/PendingAutoSendApprovals';

const AutoSendApprovalsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxW="container.lg" py={8}>
      <Box mb={6}>
        <Button 
          leftIcon={<ArrowBackIcon />} 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          mb={4}
        >
          Back to Dashboard
        </Button>
        <Heading as="h1" size="xl" mb={6}>
          Auto-Send Approvals
        </Heading>
        <PendingAutoSendApprovals />
      </Box>
    </Container>
  );
};

export default AutoSendApprovalsPage; 