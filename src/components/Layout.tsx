import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Flex, Container } from '@chakra-ui/react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuthStore } from '../store/authStore';
import { isDemoMode } from '../services/demoData';
import { DEMO_MODE } from '../services/firebase';

const Layout: React.FC = () => {
  const { user, demoMode } = useAuthStore();
  const storedDemoMode = isDemoMode();
  const location = useLocation();
  
  // Public paths that should never show sidebar
  const publicPaths = ['/', '/login', '/register', '/onboarding', '/checkout'];
  
  // Consider a user authenticated if they have a user object OR any demo mode is active
  const isAuthenticated = !!user || demoMode || storedDemoMode || DEMO_MODE;
  
  // Only show sidebar if user is authenticated AND not on a public path
  const shouldShowSidebar = isAuthenticated && !publicPaths.includes(location.pathname);
  
  // For debugging
  useEffect(() => {
    console.log('Layout component - Visibility check:', { 
      path: location.pathname, 
      user: !!user,
      demoMode,
      storedDemoMode,
      DEMO_MODE, 
      isAuthenticated,
      shouldShow: shouldShowSidebar 
    });
  }, [location.pathname, user, demoMode, storedDemoMode, isAuthenticated, shouldShowSidebar]);
  
  return (
    <Box minH="100vh" bg="neutral.100">
      {/* Always show navbar at the top */}
      <Navbar />
      
      <Box pt="64px">
        <Flex direction={{ base: 'column', md: 'row' }}>
          {/* Sidebar only shown when user is authenticated and on a protected route */}
          {shouldShowSidebar && (
            <Box 
              display={{ base: 'none', md: 'block' }} 
              position="fixed" 
              top="64px" 
              left="0" 
              h="calc(100vh - 64px)"
              w="250px"
              zIndex="100"
            >
              <Sidebar />
            </Box>
          )}
          <Box 
            as="main" 
            flex="1" 
            p={{ base: 2, md: 3 }} 
            w="full"
            ml={shouldShowSidebar ? { base: "0", md: "250px" } : "0"}
          >
            <Container maxW="container.xl" px={{ base: 2, md: 6 }}>
              <Outlet />
            </Container>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default Layout; 