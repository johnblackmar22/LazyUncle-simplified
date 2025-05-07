import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Flex } from '@chakra-ui/react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Flex>
        <Sidebar />
        <Box w="full" p={4} ml={{ base: 0, md: "220px" }} mt="60px">
          <Container maxW="container.xl" py={6}>
            <Outlet />
          </Container>
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout; 