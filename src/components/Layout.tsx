import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Flex, Container } from '@chakra-ui/react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../store/authStore';

const Layout: React.FC = () => {
  const { user } = useAuthStore();
  
  return (
    <Box minH="100vh" bg="neutral.100">
      <Navbar />
      <Flex direction={{ base: 'column', md: 'row' }}>
        {/* Sidebar only shown when user is authenticated */}
        {user && (
          <Box display={{ base: 'none', md: 'block' }}>
            <Sidebar />
          </Box>
        )}
        <Box as="main" flex="1" p={{ base: 2, md: 4 }} w="full">
          <Container maxW="container.xl" px={{ base: 2, md: 8 }}>
            <Outlet />
          </Container>
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout; 