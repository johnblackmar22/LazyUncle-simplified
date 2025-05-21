import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  List,
  ListItem,
  ListIcon,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Switch,
  Badge,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { subscriptionPlans, getYearlyPrice } from '../../services/subscription/plans';
import { useNavigate } from 'react-router-dom';
import { HomeNavbar } from '../../components/HomeNavbar';

export default function SubscriptionPlansPage() {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'neutral.800');
  const borderColor = useColorModeValue('neutral.200', 'neutral.700');
  const textColor = useColorModeValue('neutral.600', 'neutral.400');
  
  const handleSubscribe = (planId: string) => {
    // In a real app, this would navigate to checkout with the selected plan
    navigate(`/checkout?plan=${planId}&billing=${isYearly ? 'yearly' : 'monthly'}`);
  };

  return (
    <Box bg="neutral.100" minH="100vh">
      <HomeNavbar />
      <Box py={{ base: 4, md: 12 }} pt={{ base: 24, md: 32 }}>
        <Container maxW="container.xl" px={{ base: 2, md: 0 }}>
          <VStack spacing={{ base: 4, md: 8 }}>
            <Heading as="h1" size={{ base: 'lg', md: '2xl' }}>
              Subscription Plans
            </Heading>
            <Text fontSize={{ base: 'md', md: 'xl' }} textAlign="center" color={textColor} maxW="800px">
              Automate your gifting with Lazy Uncle. Our AI-powered engine recommends the perfect gifts for your loved ones, and we handle the rest.<br />
              <strong>Your subscription covers access to the service and smart gift recommendations. Each gift is charged separately at the time of purchase or approval.</strong>
            </Text>
            <HStack mb={8} spacing={4} flexWrap="wrap">
              <Text fontWeight="bold">Monthly</Text>
              <Switch
                size="lg"
                isChecked={isYearly}
                onChange={() => setIsYearly(!isYearly)}
                colorScheme="green"
              />
              <Text fontWeight="bold">Yearly</Text>
              <Badge colorScheme="green" fontSize="md" px={2} py={1} borderRadius="md">
                Save 20%
              </Badge>
            </HStack>
            <Stack
              direction={{ base: 'column', lg: 'row' }}
              textAlign="center"
              justify="center"
              spacing={{ base: 4, lg: 10 }}
              py={10}
            >
              {subscriptionPlans.map((plan) => {
                const price = isYearly 
                  ? getYearlyPrice(plan.id) 
                  : plan.price;
                const isBestValue = plan.id === 'pro';
                return (
                  <Box
                    key={plan.id}
                    mb={4}
                    shadow="lg"
                    borderWidth="2px"
                    alignSelf={{ base: 'center', lg: isBestValue ? 'flex-start' : 'center' }}
                    borderColor={isBestValue ? 'blue.500' : borderColor}
                    borderRadius={'xl'}
                    position="relative"
                    width={{ base: '100%', md: '350px' }}
                    px={{ base: 2, md: 6 }}
                    bg={bgColor}
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    minHeight="540px"
                  >
                    {isBestValue && (
                      <Box
                        position="absolute"
                        top="-16px"
                        left="50%"
                        transform="translateX(-50%)"
                      >
                        <Badge
                          borderRadius="full"
                          px={3}
                          py={1}
                          colorScheme="blue"
                          fontSize="md"
                        >
                          Best Value
                        </Badge>
                      </Box>
                    )}
                    <Box py={4} px={2} position="relative">
                      <Heading as="h3" fontSize="2xl" fontWeight="bold" mb={2}>
                        {plan.name}
                      </Heading>
                      <Text fontWeight="500" fontSize="md" mb={2}>
                        {plan.description}
                      </Text>
                      <Box display="flex" justifyContent="center" alignItems="baseline" my={6}>
                        <Text fontSize="5xl" fontWeight="900">
                          ${typeof price === 'number' ? price.toFixed(2) : '??'}
                        </Text>
                        <Text fontSize="md" ml={2} color={textColor}>
                          /{isYearly ? 'year' : 'month'}
                        </Text>
                      </Box>
                    </Box>
                    <VStack
                      bg={useColorModeValue('neutral.50', 'neutral.700')}
                      py={4}
                      borderRadius="xl"
                      flexGrow={1}
                      spacing={0}
                    >
                      <List spacing={3} textAlign="start" px={6} py={2} w="100%">
                        {plan.features.map((feature, index) => (
                          <ListItem key={index}>
                            <ListIcon as={CheckIcon} color="green.500" />
                            {feature}
                          </ListItem>
                        ))}
                      </List>
                    </VStack>
                    <Box px={6} pb={6} pt={2}>
                      <Button
                        size="lg"
                        w="full"
                        colorScheme={isBestValue ? 'blue' : 'blue'}
                        variant={isBestValue ? 'solid' : 'outline'}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        Start {isYearly ? 'Yearly' : 'Monthly'} Plan
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </VStack>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.500" mt={8} textAlign="center">
            <em>Note: Your subscription covers access to Lazy Uncle's gifting engine and automation. When a gift is selected and approved, you will be charged the exact price of that gift (plus any applicable fees or shipping). You can always review and approve gifts before purchase.</em>
          </Text>
        </Container>
      </Box>
    </Box>
  );
} 