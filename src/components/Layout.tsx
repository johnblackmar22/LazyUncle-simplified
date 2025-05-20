import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Flex, Container } from '@chakra-ui/react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

const Layout: React.FC = () => {
  return (
    <Box minH="100vh" bg="gray.100">
      <Navbar />
      <Flex>
        <Sidebar />
        <Box as="main" flex="1" p={4}>
          <Container maxW="container.xl">
            <Outlet />
          </Container>
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout; 