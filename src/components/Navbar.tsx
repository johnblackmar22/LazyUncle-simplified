import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  HStack,
  Avatar,
} from '@chakra-ui/react';

const Navbar = () => {
  // In a real app, this would come from an auth context or store
  const isLoggedIn = false;
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      position="fixed"
      w="100%"
      zIndex={999}
      bg={bg}
      borderBottom={1}
      borderStyle={'solid'}
      borderColor={borderColor}
      boxShadow="sm"
    >
      <Flex
        h={14}
        alignItems={'center'}
        justifyContent={'space-between'}
        maxW={'container.xl'}
        mx="auto"
        px={4}
      >
        <Box fontWeight="bold" fontSize="xl">
          <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            LazyUncle
          </Link>
        </Box>
        
        {isLoggedIn && (
          <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
            <Link as={RouterLink} to="/dashboard">Dashboard</Link>
            <Link as={RouterLink} to="/recipients">Recipients</Link>
            <Link as={RouterLink} to="/gifts">Gifts</Link>
          </HStack>
        )}

        <Flex alignItems={'center'}>
          {isLoggedIn ? (
            <Menu>
              <MenuButton
                as={Button}
                variant={'link'}
                cursor={'pointer'}
                minW={0}
              >
                <HStack>
                  <Avatar size="sm" src="" name="User" />
                  <Text display={{ base: 'none', md: 'flex' }}>
                    User
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                <MenuItem as={RouterLink} to="/settings">Settings</MenuItem>
                <MenuItem as={RouterLink} to="/logout">Sign Out</MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Stack
              flex={{ base: 1, md: 0 }}
              justify={'flex-end'}
              direction={'row'}
              spacing={6}
            >
              <Button
                as={RouterLink}
                fontSize={'sm'}
                fontWeight={400}
                variant={'link'}
                to={'/login'}
              >
                Sign In
              </Button>
              <Button
                as={RouterLink}
                display={{ base: 'none', md: 'inline-flex' }}
                fontSize={'sm'}
                fontWeight={600}
                color={'white'}
                bg={'brand.500'}
                to={'/register'}
                _hover={{
                  bg: 'brand.600',
                }}
              >
                Sign Up
              </Button>
            </Stack>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar; 