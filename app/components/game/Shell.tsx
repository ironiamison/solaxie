import { Box, Flex, HStack, Image, Text, VStack } from "@chakra-ui/react";
import WalletMultiButton from "@/components/WalletMultiButton";
import type { GameApi, TabId } from "./types";

function ResourcePill({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <HStack
      bg="rgba(8,5,18,0.66)"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="full"
      pl="6px"
      pr={3}
      py="3px"
      spacing={2}
      boxShadow="0 4px 14px rgba(0,0,0,0.45)"
      backdropFilter="blur(6px)"
    >
      <Image src={icon} alt="" boxSize="26px" objectFit="contain" />
      <VStack spacing={0} align="start" lineHeight="1">
        <Text fontSize="sm" fontWeight="800" color="white" fontFamily="'Baloo 2', sans-serif">
          {value}
        </Text>
        <Text fontSize="0.55rem" color="whiteAlpha.600" letterSpacing="0.5px" textTransform="uppercase">
          {label}
        </Text>
      </VStack>
    </HStack>
  );
}

export function TopBar({ game }: { game: GameApi }) {
  const { player, tokenBalance, myAxols } = game;
  const level = 1 + (player?.battlesWon ?? 0) + myAxols.length;
  const xpPct = Math.max(8, tokenBalance % 100);

  return (
    <Flex
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={30}
      px={{ base: 3, md: 5 }}
      py={2}
      align="center"
      gap={3}
      bgGradient="linear(to-b, rgba(8,5,18,0.85), rgba(8,5,18,0))"
    >
      <Image src="/logo.png" alt="Solaxie" h="32px" objectFit="contain" mr={1} />

      <HStack spacing={2}>
        <ResourcePill icon="/icons/coin.png" value={Math.round(tokenBalance).toLocaleString()} label="SOLAX" />
        <ResourcePill icon="/icons/dna.png" value={player?.battlesWon ?? 0} label="DNA" />
        <ResourcePill icon="/icons/egg.png" value={myAxols.length} label="Axols" />
      </HStack>

      <Box flex={1} />

      {player && (
        <HStack
          bg="rgba(8,5,18,0.66)"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          borderRadius="full"
          pl="4px"
          pr={3}
          py="3px"
          spacing={2}
          backdropFilter="blur(6px)"
          display={{ base: "none", md: "flex" }}
        >
          <Box position="relative">
            <Image
              src="/hero-axolotl.png"
              alt=""
              boxSize="34px"
              borderRadius="full"
              bg="rgba(255,95,176,0.25)"
              objectFit="cover"
            />
          </Box>
          <VStack spacing={1} align="start" lineHeight="1" minW="120px">
            <HStack spacing={2} w="100%">
              <Text fontSize="sm" fontWeight="700" color="white" noOfLines={1}>
                {player.name}
              </Text>
              <Box flex={1} />
              <Text fontSize="0.6rem" color="brand.200" fontWeight="800">
                Lv {level}
              </Text>
            </HStack>
            <Box w="100%" h="5px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden">
              <Box h="100%" w={`${xpPct}%`} bgGradient="linear(to-r, #8a37ff, #ff6fd8)" />
            </Box>
          </VStack>
        </HStack>
      )}

      <WalletMultiButton />
    </Flex>
  );
}

const NAV: { id: TabId; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "🏝️" },
  { id: "collection", label: "Collection", icon: "🎴" },
  { id: "battle", label: "Battle", icon: "⚔️" },
  { id: "market", label: "Market", icon: "🛒" },
  { id: "empire", label: "Empire", icon: "🏰" },
];

export function BottomNav({ game }: { game: GameApi }) {
  return (
    <Flex
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={30}
      justify="center"
      pb={3}
      pt={6}
      bgGradient="linear(to-t, rgba(8,5,18,0.92), rgba(8,5,18,0))"
      pointerEvents="none"
    >
      <HStack
        spacing={1}
        bg="rgba(15,10,29,0.92)"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        borderRadius="2xl"
        p="6px"
        boxShadow="0 18px 44px rgba(0,0,0,0.6)"
        backdropFilter="blur(10px)"
        pointerEvents="auto"
      >
        {NAV.map((n) => {
          const active = game.tab === n.id;
          return (
            <VStack
              key={n.id}
              as="button"
              onClick={() => game.setTab(n.id)}
              spacing="2px"
              px={{ base: 3, md: 5 }}
              py={2}
              borderRadius="xl"
              minW={{ base: "58px", md: "76px" }}
              transition="all 0.15s"
              bgGradient={active ? "linear(to-b, #8a37ff, #5912d6)" : "none"}
              boxShadow={active ? "0 6px 18px rgba(138,55,255,0.55)" : "none"}
              _hover={{ bg: active ? undefined : "whiteAlpha.100" }}
            >
              <Text fontSize="lg" filter={active ? "none" : "grayscale(0.3)"} opacity={active ? 1 : 0.85}>
                {n.icon}
              </Text>
              <Text
                fontSize="0.62rem"
                fontWeight="700"
                color={active ? "white" : "whiteAlpha.600"}
                letterSpacing="0.3px"
              >
                {n.label}
              </Text>
            </VStack>
          );
        })}
      </HStack>
    </Flex>
  );
}
