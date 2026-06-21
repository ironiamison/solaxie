import { Box, Flex, HStack, Image, Text, VStack, keyframes } from "@chakra-ui/react";
import { spritePath } from "@/utils/anchor";
import type { GameApi } from "./types";
import type { AxolView } from "@/components/AxolCard";
import { CLASS_NAMES, primaryClass } from "@/utils/anchor";

const bob = keyframes`
  0%,100% { transform: translateY(0) }
  50% { transform: translateY(-8px) }
`;

// Hotspot anchor points tuned to /home-bg.png (percent of the scene box).
type Spot = {
  x: number;
  y: number;
  title: string;
  sub: string;
  icon: string;
  onClick: (g: GameApi) => void;
};

const SPOTS: Spot[] = [
  { x: 21, y: 26, title: "Arena Cave", sub: "Fight to earn SOLAX", icon: "⚔️", onClick: (g) => g.setTab("battle") },
  { x: 15, y: 58, title: "DNA Shrine", sub: "Roll a new Axol", icon: "🌀", onClick: (g) => g.mintAxol() },
  { x: 74, y: 16, title: "Nursery Tree", sub: "Breed your Axols", icon: "🥚", onClick: (g) => g.openBreed() },
  { x: 84, y: 56, title: "Harbor Market", sub: "Trade & shop", icon: "🛒", onClick: (g) => g.setTab("market") },
];

// Scatter positions inside the central pond for living Axols.
const PERCH = [
  { x: 40, y: 52 },
  { x: 55, y: 48 },
  { x: 47, y: 64 },
  { x: 60, y: 60 },
  { x: 36, y: 66 },
  { x: 64, y: 70 },
];

const STATUS = ["Sleeping", "Playing", "Fishing", "Chasing butterflies", "Splashing", "Napping"];

function Hotspot({ spot, game }: { spot: Spot; game: GameApi }) {
  return (
    <HStack
      position="absolute"
      left={`${spot.x}%`}
      top={`${spot.y}%`}
      transform="translate(-50%,-50%)"
      as="button"
      onClick={() => spot.onClick(game)}
      bg="rgba(8,5,18,0.72)"
      borderWidth="1px"
      borderColor="whiteAlpha.300"
      borderRadius="full"
      pl="6px"
      pr={3}
      py="4px"
      spacing={2}
      backdropFilter="blur(6px)"
      boxShadow="0 6px 20px rgba(0,0,0,0.5)"
      transition="all 0.15s"
      _hover={{ transform: "translate(-50%,-50%) scale(1.06)", borderColor: "brand.300", boxShadow: "0 0 18px rgba(138,55,255,0.6)" }}
    >
      <Flex boxSize="28px" align="center" justify="center" borderRadius="full" bgGradient="linear(to-b, #8a37ff, #5912d6)" fontSize="md">
        {spot.icon}
      </Flex>
      <VStack spacing={0} align="start" lineHeight="1.1" pr={1}>
        <Text fontSize="0.74rem" fontWeight="800" color="white" whiteSpace="nowrap">
          {spot.title}
        </Text>
        <Text fontSize="0.58rem" color="whiteAlpha.700" whiteSpace="nowrap">
          {spot.sub}
        </Text>
      </VStack>
    </HStack>
  );
}

function PondAxol({ axol, idx, game }: { axol: AxolView; idx: number; game: GameApi }) {
  const perch = PERCH[idx % PERCH.length];
  const status = STATUS[axol.id % STATUS.length];
  const name = `${CLASS_NAMES[primaryClass(axol.genome)]} #${axol.id}`;
  return (
    <VStack
      position="absolute"
      left={`${perch.x}%`}
      top={`${perch.y}%`}
      transform="translate(-50%,-50%)"
      spacing={1}
      as="button"
      onClick={() => {
        game.setSelectedId(axol.id);
        game.setTab("collection");
      }}
      role="group"
    >
      <VStack
        spacing={0}
        bg="rgba(8,5,18,0.7)"
        borderRadius="md"
        px={2}
        py="2px"
        opacity={0.92}
        _groupHover={{ opacity: 1 }}
      >
        <Text fontSize="0.62rem" fontWeight="800" color="white" whiteSpace="nowrap" lineHeight="1.2">
          {name}
        </Text>
        <Text fontSize="0.5rem" color="whiteAlpha.700" whiteSpace="nowrap">
          {status}
        </Text>
      </VStack>
      <Image
        src={spritePath(axol.genome)}
        alt=""
        boxSize={{ base: "66px", md: "84px" }}
        objectFit="contain"
        filter="drop-shadow(0 8px 10px rgba(0,0,0,0.55))"
        animation={`${bob} ${3 + (axol.id % 3)}s ease-in-out infinite`}
        transition="transform 0.15s"
        _groupHover={{ transform: "scale(1.08)" }}
      />
    </VStack>
  );
}

function Panel({ title, children, ...rest }: any) {
  return (
    <Box
      bg="rgba(15,10,29,0.86)"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="xl"
      p={3}
      boxShadow="0 12px 30px rgba(0,0,0,0.5)"
      backdropFilter="blur(8px)"
      w="210px"
      {...rest}
    >
      {title && (
        <Text fontSize="0.7rem" fontWeight="800" letterSpacing="0.8px" textTransform="uppercase" color="brand.200" mb={2}>
          {title}
        </Text>
      )}
      {children}
    </Box>
  );
}

function QuestRow({ done, label, prog }: { done: boolean; label: string; prog: string }) {
  return (
    <HStack justify="space-between" py="3px">
      <HStack spacing={2}>
        <Flex boxSize="16px" align="center" justify="center" borderRadius="full" bg={done ? "green.400" : "whiteAlpha.200"} fontSize="0.6rem">
          {done ? "✓" : ""}
        </Flex>
        <Text fontSize="0.68rem" color="whiteAlpha.900">
          {label}
        </Text>
      </HStack>
      <Text fontSize="0.62rem" color="whiteAlpha.600" fontWeight="700">
        {prog}
      </Text>
    </HStack>
  );
}

const FRIENDS = [
  { name: "james.sol", status: "In Battle", color: "#ff5fb0" },
  { name: "sarah.sol", status: "In Nursery", color: "#54e07a" },
  { name: "mike.sol", status: "Online", color: "#3db4ff" },
];

export default function HomeScreen({ game }: { game: GameApi }) {
  const { player, myAxols } = game;
  const wins = player?.battlesWon ?? 0;

  return (
    <Box position="relative" minH="100vh" overflow="hidden">
      {/* Scene */}
      <Box
        position="absolute"
        inset={0}
        bgImage="url(/home-bg.png)"
        bgSize="cover"
        bgPosition="center"
      />
      <Box position="absolute" inset={0} bgGradient="linear(to-b, rgba(10,6,24,0.35), rgba(10,6,24,0.15) 40%, rgba(10,6,24,0.75))" />

      {/* Scene-anchored layer */}
      <Box position="absolute" inset={0}>
        {SPOTS.map((s) => (
          <Hotspot key={s.title} spot={s} game={game} />
        ))}

        {/* Center pond sign */}
        <VStack position="absolute" left="50%" top="36%" transform="translate(-50%,-50%)" spacing={1} pointerEvents="none">
          <Box
            bgGradient="linear(to-b, #c98a4b, #8a5a2b)"
            borderWidth="2px"
            borderColor="#5e3b1a"
            borderRadius="lg"
            px={4}
            py={1}
            boxShadow="0 6px 18px rgba(0,0,0,0.5)"
          >
            <Text fontFamily="'Baloo 2', sans-serif" fontWeight="800" color="#fff4e0" letterSpacing="0.5px" textShadow="0 2px 0 #6b4220">
              YOUR POND
            </Text>
          </Box>
          <Box bg="rgba(8,5,18,0.7)" borderRadius="full" px={3} py="2px">
            <Text fontSize="0.62rem" color="whiteAlpha.800" fontWeight="600">
              {myAxols.length} Axol{myAxols.length === 1 ? "" : "s"} living here
            </Text>
          </Box>
        </VStack>

        {/* Living Axols */}
        {myAxols.slice(0, 6).map((a, i) => (
          <PondAxol key={a.id} axol={a} idx={i} game={game} />
        ))}

        {myAxols.length === 0 && (
          <VStack position="absolute" left="50%" top="58%" transform="translate(-50%,-50%)" spacing={3}>
            <Text color="whiteAlpha.800" fontSize="sm" textAlign="center" maxW="260px">
              Your pond is empty. Visit the <b>DNA Shrine</b> to roll your first Axol!
            </Text>
            <Box
              as="button"
              onClick={() => game.mintAxol()}
              px={5}
              py={2}
              borderRadius="xl"
              fontWeight="800"
              color="white"
              bgGradient="linear(to-r, #8a37ff, #d63cff)"
              boxShadow="0 8px 24px rgba(138,55,255,0.5)"
            >
              {game.busy === "mint" ? "Rolling…" : "🌀 Roll an Axol"}
            </Box>
          </VStack>
        )}
      </Box>

      {/* Floating HUD panels */}
      <Box position="absolute" top="64px" right={4} display={{ base: "none", lg: "block" }}>
        <Panel title="Daily Quests">
          <QuestRow done={wins >= 3} label="Win 3 battles" prog={`${Math.min(wins, 3)}/3`} />
          <QuestRow done={myAxols.length >= 1} label="Own an Axol" prog={`${Math.min(myAxols.length, 1)}/1`} />
          <QuestRow done={false} label="Breed once" prog="0/1" />
          <HStack mt={2} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.200" justify="center" spacing={2}>
            <Image src="/icons/egg.png" boxSize="24px" alt="" />
            <Text fontSize="0.65rem" color="whiteAlpha.800" fontWeight="700">
              Reward: Mystery Egg
            </Text>
          </HStack>
        </Panel>
      </Box>

      <Box position="absolute" bottom="92px" left={4} display={{ base: "none", lg: "block" }}>
        <Panel title="Friends Online">
          <VStack align="stretch" spacing={1}>
            {FRIENDS.map((f) => (
              <HStack key={f.name} justify="space-between">
                <HStack spacing={2}>
                  <Box boxSize="7px" borderRadius="full" bg={f.color} boxShadow={`0 0 8px ${f.color}`} />
                  <Text fontSize="0.68rem" color="whiteAlpha.900">
                    {f.name}
                  </Text>
                </HStack>
                <Text fontSize="0.56rem" color="whiteAlpha.500">
                  {f.status}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Panel>
      </Box>

      <Box position="absolute" bottom="92px" right={4} display={{ base: "none", lg: "block" }}>
        <Panel title="Live Events">
          <VStack align="stretch" spacing={2}>
            <HStack spacing={2}>
              <Image src="/icons/egg.png" boxSize="22px" alt="" />
              <VStack spacing={0} align="start" lineHeight="1.1">
                <Text fontSize="0.68rem" fontWeight="700" color="white">
                  Egg Rush
                </Text>
                <Text fontSize="0.54rem" color="whiteAlpha.600">
                  2h 18m left
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              <Image src="/icons/dna.png" boxSize="22px" alt="" />
              <VStack spacing={0} align="start" lineHeight="1.1">
                <Text fontSize="0.68rem" fontWeight="700" color="white">
                  Battle Season 1
                </Text>
                <Text fontSize="0.54rem" color="whiteAlpha.600">
                  13d 7h left
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Panel>
      </Box>
    </Box>
  );
}
