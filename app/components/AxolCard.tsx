import { Box, Badge, HStack, VStack, Text, Wrap, WrapItem, Image } from "@chakra-ui/react";
import {
  CLASS_NAMES,
  PART_NAMES,
  deriveStats,
  expressedClasses,
  primaryClass,
} from "@/utils/anchor";
import { CLASS_NEON } from "@/theme";

export type AxolView = {
  id: number;
  genome: number[][];
  generation: number;
  breedCount: number;
  level: number;
  xp: number;
};

type Props = {
  axol: AxolView;
  selected?: boolean;
  onClick?: () => void;
  badge?: string;
};

const CLASS_ART: Record<string, string> = {
  Beast: "/axols/beast.png",
  Aquatic: "/axols/aquatic.png",
  Plant: "/axols/plant.png",
  Bird: "/axols/bird.png",
  Bug: "/axols/bug.png",
  Reptile: "/axols/reptile.png",
};

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(6, Math.min(100, (value / max) * 100));
  return (
    <Box>
      <HStack justify="space-between" mb="2px">
        <Text fontSize="0.62rem" color="whiteAlpha.700" fontWeight="600" letterSpacing="0.5px">
          {label}
        </Text>
        <Text fontSize="0.62rem" color="whiteAlpha.900" fontWeight="700">
          {value}
        </Text>
      </HStack>
      <Box h="5px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden">
        <Box h="100%" w={`${pct}%`} bg={color} borderRadius="full" boxShadow={`0 0 8px ${color}`} />
      </Box>
    </Box>
  );
}

const AxolCard = ({ axol, selected, onClick, badge }: Props) => {
  const cls = primaryClass(axol.genome);
  const className = CLASS_NAMES[cls];
  const color = CLASS_NEON[className];
  const stats = deriveStats(axol.genome);
  const parts = expressedClasses(axol.genome);

  return (
    <Box
      onClick={onClick}
      cursor={onClick ? "pointer" : "default"}
      position="relative"
      borderWidth="1px"
      borderColor={selected ? color : "whiteAlpha.200"}
      boxShadow={selected ? `0 0 0 2px ${color}, 0 0 26px ${color}88` : "0 10px 30px rgba(0,0,0,0.45)"}
      borderRadius="2xl"
      p={3}
      w="232px"
      bg="rgba(21,15,41,0.9)"
      backdropFilter="blur(6px)"
      transition="all 0.18s ease"
      _hover={onClick ? { transform: "translateY(-4px)", borderColor: color, boxShadow: `0 0 22px ${color}66` } : {}}
    >
      <HStack justify="space-between" mb={2}>
        <Badge
          px={2}
          py="2px"
          borderRadius="full"
          fontSize="0.62rem"
          letterSpacing="0.4px"
          color="white"
          bg={color}
          boxShadow={`0 0 12px ${color}99`}
        >
          {className}
        </Badge>
        <Text fontSize="xs" color="whiteAlpha.500" fontWeight="700">
          #{axol.id}
        </Text>
      </HStack>

      <Box
        position="relative"
        borderRadius="xl"
        overflow="hidden"
        mb={3}
        bgGradient={`radial(circle at 50% 35%, ${color}33, transparent 70%)`}
      >
        <Image
          src={CLASS_ART[className]}
          alt={className}
          w="100%"
          h="148px"
          objectFit="cover"
          draggable={false}
        />
        <HStack
          position="absolute"
          bottom="6px"
          left="6px"
          spacing={1}
        >
          <Badge bg="blackAlpha.700" color="white" borderRadius="md" fontSize="0.58rem">
            Lvl {axol.level}
          </Badge>
          <Badge bg="blackAlpha.700" color="white" borderRadius="md" fontSize="0.58rem">
            Gen {axol.generation}
          </Badge>
        </HStack>
      </Box>

      <VStack align="stretch" spacing="6px">
        <StatBar label="HP" value={stats.hp} max={120} color={color} />
        <StatBar label="SPEED" value={stats.speed} max={54} color={color} />
        <StatBar label="SKILL" value={stats.skill} max={36} color={color} />
        <StatBar label="MORALE" value={stats.morale} max={48} color={color} />
      </VStack>

      <HStack mt={2} justify="space-between" fontSize="0.62rem" color="whiteAlpha.600">
        <Text>Bred {axol.breedCount}/7</Text>
        <Text>XP {axol.xp}</Text>
      </HStack>

      <Wrap mt={2} spacing={1}>
        {parts.map((p, i) => (
          <WrapItem key={i}>
            <Badge
              variant="outline"
              fontSize="0.55rem"
              borderColor={`${CLASS_NEON[CLASS_NAMES[p]]}66`}
              style={{ color: CLASS_NEON[CLASS_NAMES[p]] }}
              title={PART_NAMES[i]}
            >
              {PART_NAMES[i]}: {CLASS_NAMES[p]}
            </Badge>
          </WrapItem>
        ))}
      </Wrap>

      {badge && (
        <Badge
          mt={2}
          bg={color}
          color="white"
          borderRadius="full"
          px={2}
          boxShadow={`0 0 12px ${color}99`}
        >
          {badge}
        </Badge>
      )}
    </Box>
  );
};

export default AxolCard;
