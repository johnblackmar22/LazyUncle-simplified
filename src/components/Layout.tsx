import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Flex, Container } from '@chakra-ui/react';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../store/authStore';

const Layout: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  
  // Public paths that should never show sidebar
  const publicPaths = ['/', '/login', '/register', '/onboarding', '/subscription/plans', '/how-it-works', '/checkout'];
  
  // Only show sidebar if user is authenticated AND not on a public path
  const shouldShowSidebar = !!user && !publicPaths.includes(location.pathname);
  
  console.log('Sidebar visibility check:', { 
    path: location.pathname, 
    user: !!user, 
    shouldShow: shouldShowSidebar 
  });
  
  return (
    <Box minH="100vh" bg="neutral.100">
      <Flex direction={{ base: 'column', md: 'row' }}>
        {/* Sidebar only shown when user is authenticated and on a protected route */}
        {shouldShowSidebar && (
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