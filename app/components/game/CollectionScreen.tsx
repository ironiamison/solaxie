import { Box, Flex, Grid, HStack, Image, SimpleGrid, Text, VStack, keyframes } from "@chakra-ui/react";
import {
  battleStats,
  CLASS_NAMES,
  primaryClass,
  rarity,
  spritePath,
} from "@/utils/anchor";
import { CLASS_NEON } from "@/theme";
import type { AxolView } from "@/components/AxolCard";
import type { GameApi } from "./types";

const float = keyframes`
  0%,100% { transform: translateY(0) }
  50% { transform: translateY(-10px) }
`;

function Stars({ n, color }: { n: number; color: string }) {
  return (
    <HStack spacing="2px">
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} fontSize="md" color={i <= n ? color : "whiteAlpha.300"} textShadow={i <= n ? `0 0 6px ${color}` : "none"}>
          ★
        </Text>
      ))}
    </HStack>
  );
}

function CollectionCard({ axol, active, onClick }: { axol: AxolView; active: boolean; onClick: () => void }) {
  const r = rarity(axol.genome);
  return (
    <Box
      as="button"
      onClick={onClick}
      position="relative"
      borderWidth="2px"
      borderColor={active ? r.color : "whiteAlpha.200"}
      borderRadius="xl"
      overflow="hidden"
      bg="rgba(8,5,18,0.6)"
      boxShadow={active ? `0 0 0 2px ${r.color}, 0 0 16px ${r.color}aa` : "none"}
      transition="all 0.15s"
      _hover={{ borderColor: r.color, transform: "translateY(-2px)" }}
    >
      <Box bgGradient={`radial(circle at 50% 35%, ${r.color}33, transparent 70%)`}>
        <Image src={spritePath(axol.genome)} alt="" w="100%" h="64px" objectFit="contain" />
      </Box>
      <HStack position="absolute" top="3px" left="3px" spacing="1px">
        {Array.from({ length: r.stars }).map((_, i) => (
          <Text key={i} fontSize="0.5rem" color={r.color}>
            ★
          </Text>
        ))}
      </HStack>
      <Text position="absolute" top="2px" right="4px" fontSize="0.55rem" fontWeight="800" color="whiteAlpha.700">
        #{axol.id}
      </Text>
      <Box bg="rgba(8,5,18,0.8)" py="2px">
        <Text fontSize="0.55rem" fontWeight="700" color="whiteAlpha.800" textAlign="center">
          Lv {axol.level}
        </Text>
      </Box>
    </Box>
  );
}

function StatChip({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <VStack
      spacing={0}
      bg="rgba(8,5,18,0.6)"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      px={3}
      py={2}
      minW="74px"
    >
      <Text fontSize="sm">{icon}</Text>
      <Text fontSize="md" fontWeight="800" color="white" fontFamily="'Baloo 2', sans-serif" lineHeight="1">
        {value}
      </Text>
      <Text fontSize="0.5rem" color={color} fontWeight="700" letterSpacing="0.5px">
        {label}
      </Text>
    </VStack>
  );
}

const ACTIONS: { key: string; label: string; sub: string; icon: string; grad: string; run: (g: GameApi, id: number) => void }[] = [
  { key: "battle", label: "BATTLE", sub: "Fight players", icon: "⚔️", grad: "linear(to-r, #ff4d4d, #ff2d7a)", run: (g) => g.setTab("battle") },
  { key: "breed", label: "BREED", sub: "Create new Axols", icon: "🥚", grad: "linear(to-r, #ff3d9a, #ff7a3d)", run: (g) => g.openBreed() },
  { key: "roll", label: "DNA ROLL", sub: "Try your luck", icon: "🌀", grad: "linear(to-r, #8a37ff, #d63cff)", run: (g) => g.mintAxol() },
  { key: "mutate", label: "MUTATE", sub: "Boost your genes", icon: "🧬", grad: "linear(to-r, #3db4ff, #6a5cff)", run: (g) => g.comingSoon("Mutate") },
  { key: "upgrade", label: "UPGRADE", sub: "Power up Axol", icon: "⭐", grad: "linear(to-r, #ffb02e, #ff7a3d)", run: (g) => g.comingSoon("Upgrade") },
  { key: "equip", label: "EQUIP", sub: "Items & gear", icon: "🎒", grad: "linear(to-r, #2fe0cf, #2fa0e0)", run: (g) => g.comingSoon("Equip") },
];

function ActionButton({ a, game, id }: { a: (typeof ACTIONS)[number]; game: GameApi; id: number }) {
  return (
    <HStack
      as="button"
      onClick={() => a.run(game, id)}
      w="100%"
      spacing={3}
      px={3}
      py="10px"
      borderRadius="xl"
      bg="rgba(8,5,18,0.55)"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      transition="all 0.15s"
      _hover={{ transform: "translateX(-3px)", borderColor: "whiteAlpha.400", bg: "rgba(8,5,18,0.75)" }}
    >
      <Flex boxSize="34px" align="center" justify="center" borderRadius="lg" bgGradient={a.grad} fontSize="md" boxShadow="0 4px 12px rgba(0,0,0,0.4)">
        {a.icon}
      </Flex>
      <VStack spacing={0} align="start" lineHeight="1.1" flex={1}>
        <Text fontSize="0.8rem" fontWeight="800" color="white">
          {a.label}
        </Text>
        <Text fontSize="0.58rem" color="whiteAlpha.600">
          {a.sub}
        </Text>
      </VStack>
      <Text color="whiteAlpha.500">›</Text>
    </HStack>
  );
}

const FEED = [
  { who: "james.sol", what: "bred a Plant Beast!", color: "#54e07a", t: "2m" },
  { who: "sarah.sol", what: "hatched a Legendary Bird!", color: "#ff5fb0", t: "5m" },
  { who: "mike.sol", what: "won 8 battles in a row!", color: "#3db4ff", t: "12m" },
  { who: "luna.sol", what: "rolled a Legendary Axol!", color: "#ffb02e", t: "15m" },
];

export default function CollectionScreen({ game }: { game: GameApi }) {
  const { myAxols } = game;
  const selected =
    myAxols.find((a) => a.id === game.selectedId) ?? myAxols[0] ?? null;

  return (
    <Box position="relative" minH="100vh" overflow="hidden">
      <Box position="absolute" inset={0} bgImage="url(/profile-bg.png)" bgSize="cover" bgPosition="center" />
      <Box position="absolute" inset={0} bgGradient="linear(to-b, rgba(8,5,20,0.55), rgba(8,5,20,0.82))" />

      <Box position="relative" zIndex={1} maxW="1280px" mx="auto" px={4} pt="64px" pb="110px">
        <Grid templateColumns={{ base: "1fr", lg: "230px 1fr 250px" }} gap={4} alignItems="start">
          {/* Collection */}
          <Box
            bg="rgba(15,10,29,0.8)"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderRadius="2xl"
            p={3}
            backdropFilter="blur(8px)"
            display={{ base: "none", lg: "block" }}
          >
            <Text fontSize="0.72rem" fontWeight="800" letterSpacing="0.8px" textTransform="uppercase" color="brand.200" mb={3}>
              Collection ({myAxols.length})
            </Text>
            {myAxols.length === 0 ? (
              <Text fontSize="0.7rem" color="whiteAlpha.600">
                No Axols yet — roll one with DNA Roll.
              </Text>
            ) : (
              <SimpleGrid columns={2} spacing={2} maxH="62vh" overflowY="auto">
                {myAxols.map((a) => (
                  <CollectionCard key={a.id} axol={a} active={selected?.id === a.id} onClick={() => game.setSelectedId(a.id)} />
                ))}
              </SimpleGrid>
            )}
          </Box>

          {/* Featured */}
          <VStack spacing={4}>
            {selected ? (
              <FeaturedAxol axol={selected} game={game} />
            ) : (
              <VStack py={20} spacing={4}>
                <Image src="/hero-axolotl.png" boxSize="160px" alt="" animation={`${float} 4s ease-in-out infinite`} />
                <Text color="whiteAlpha.800">No Axols yet. Roll your first one!</Text>
                <Box
                  as="button"
                  onClick={() => game.mintAxol()}
                  px={6}
                  py={3}
                  borderRadius="xl"
                  fontWeight="800"
                  color="white"
                  bgGradient="linear(to-r, #8a37ff, #d63cff)"
                  boxShadow="0 8px 24px rgba(138,55,255,0.5)"
                >
                  {game.busy === "mint" ? "Rolling…" : "🌀 DNA Roll"}
                </Box>
              </VStack>
            )}
          </VStack>

          {/* Actions */}
          <VStack
            spacing={4}
            align="stretch"
            bg="rgba(15,10,29,0.8)"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderRadius="2xl"
            p={3}
            backdropFilter="blur(8px)"
          >
            <Text fontSize="0.72rem" fontWeight="800" letterSpacing="0.8px" textTransform="uppercase" color="brand.200">
              Actions
            </Text>
            {ACTIONS.map((a) => (
              <ActionButton key={a.key} a={a} game={game} id={selected?.id ?? -1} />
            ))}
          </VStack>
        </Grid>

        {/* Live feed */}
        <Box
          mt={4}
          bg="rgba(15,10,29,0.8)"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          borderRadius="2xl"
          p={3}
          backdropFilter="blur(8px)"
          maxW={{ lg: "520px" }}
        >
          <Text fontSize="0.72rem" fontWeight="800" letterSpacing="0.8px" textTransform="uppercase" color="brand.200" mb={2}>
            Live Feed
          </Text>
          <VStack align="stretch" spacing={1}>
            {FEED.map((f, i) => (
              <HStack key={i} justify="space-between">
                <Text fontSize="0.7rem" color="whiteAlpha.900">
                  <b style={{ color: f.color }}>{f.who}</b> {f.what}
                </Text>
                <Text fontSize="0.56rem" color="whiteAlpha.500">
                  {f.t}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

function FeaturedAxol({ axol, game }: { axol: AxolView; game: GameApi }) {
  const cls = primaryClass(axol.genome);
  const className = CLASS_NAMES[cls];
  const color = CLASS_NEON[className];
  const r = rarity(axol.genome);
  const s = battleStats(axol.genome);
  const xpPct = Math.max(6, axol.xp % 100);

  return (
    <VStack spacing={3} w="100%">
      <VStack spacing={1}>
        <Text fontSize="0.66rem" color="whiteAlpha.600" letterSpacing="1px" fontWeight="700">
          CURRENT AXOL
        </Text>
        <Text fontSize="2xl" fontWeight="800" color="white" fontFamily="'Baloo 2', sans-serif" lineHeight="1">
          {className} #{axol.id}
        </Text>
        <HStack>
          <Box bg={r.color} color="#1a1030" px={2} borderRadius="full" fontSize="0.6rem" fontWeight="800" letterSpacing="0.5px">
            {r.tier.toUpperCase()}
          </Box>
          <Stars n={r.stars} color={r.color} />
        </HStack>
      </VStack>

      <Box position="relative" w="100%" maxW="340px" h="240px">
        <Box position="absolute" bottom="14px" left="50%" transform="translateX(-50%)" w="180px" h="40px" borderRadius="50%" bg={`${color}44`} filter="blur(14px)" />
        <Box position="absolute" bottom={0} left="50%" transform="translateX(-50%)" w="220px" h="60px" borderRadius="50%" borderWidth="2px" borderColor={`${color}88`} boxShadow={`0 0 30px ${color}66`} />
        <Image
          src={spritePath(axol.genome)}
          alt={className}
          position="absolute"
          bottom="22px"
          left="50%"
          transform="translateX(-50%)"
          h="210px"
          objectFit="contain"
          filter="drop-shadow(0 16px 18px rgba(0,0,0,0.6))"
          animation={`${float} 4s ease-in-out infinite`}
        />
      </Box>

      <HStack spacing={2}>
        <StatChip icon="❤️" label="HP" value={s.hp} color="#ff6b6b" />
        <StatChip icon="⚔️" label="ATK" value={s.atk} color="#ffb02e" />
        <StatChip icon="🛡️" label="DEF" value={s.def} color="#3db4ff" />
        <StatChip icon="⚡" label="SPD" value={s.spd} color="#54e07a" />
      </HStack>

      <Box w="100%" maxW="360px">
        <HStack justify="space-between" mb="3px">
          <Text fontSize="0.64rem" color="whiteAlpha.700" fontWeight="700">
            Lv {axol.level} · Gen {axol.generation}
          </Text>
          <Text fontSize="0.64rem" color="whiteAlpha.500">
            XP {axol.xp}
          </Text>
        </HStack>
        <Box h="8px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden">
          <Box h="100%" w={`${xpPct}%`} bgGradient="linear(to-r, #8a37ff, #ff6fd8)" />
        </Box>
      </Box>

      <Box
        as="button"
        onClick={() => game.comingSoon("Feed")}
        w="100%"
        maxW="360px"
        py={2}
        borderRadius="xl"
        fontWeight="800"
        color="white"
        bgGradient="linear(to-r, #ff4d6d, #ff2d7a)"
        boxShadow="0 8px 22px rgba(255,45,122,0.4)"
      >
        FEED 🍓 25
      </Box>
    </VStack>
  );
}
