"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, Image } from "react-native"
import { Card, Text, Chip, Button } from "react-native-paper"
import { supabase } from "../../lib/supabase"
import { useRouter } from "expo-router"
import { Star } from "lucide-react-native"

interface TopGame {
  id: number
  name: string
  thumbnail_url: string
  description: string
  min_players: number
  max_players: number
  playing_time: number
  average_rating: number
  total_evaluations: number
  rank: number
}

export default function TopGamesScreen() {
  const [topGames, setTopGames] = useState<TopGame[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchTopGames = async () => {
    try {
      
      const { data, error } = await supabase
        .from("games")
        .select(`
          id,
          name,
          thumbnail_url,
          description,
          min_players,
          max_players,
          playing_time,
          evaluations!inner(rating)
        `)
        .order("id")

      if (error) {
        console.error("Erro ao buscar top jogos:", error)
        return
      }

      // Calcular média e ranking
      const gamesWithRatings = data
        .map((game: any) => {
          const ratingsArray = game.evaluations.map((evaluation: any) => evaluation.rating)
          const averageRating =
            ratingsArray.length > 0
              ? ratingsArray.reduce((sum: number, rating: number) => sum + rating, 0) / ratingsArray.length
              : 0

          return {
            id: game.id,
            name: game.name,
            thumbnail_url: game.thumbnail_url,
            description: game.description,
            min_players: game.min_players,
            max_players: game.max_players,
            playing_time: game.playing_time,
            average_rating: averageRating,
            total_evaluations: ratingsArray.length,
            rank: 0, // Será definido após ordenação
          }
        })
        .filter((game: any) => game.total_evaluations > 0) // Apenas jogos com avaliações
        .sort((a: any, b: any) => b.average_rating - a.average_rating) // Ordenar por nota
        .map((game: any, index: number) => ({ ...game, rank: index + 1 })) // Adicionar ranking

      setTopGames(gamesWithRatings)
    } catch (error) {
      console.error("Erro inesperado:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        color={index < Math.floor(rating) ? "#FFD700" : "#E0E0E0"}
        fill={index < Math.floor(rating) ? "#FFD700" : "transparent"}
      />
    ))
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return styles.goldRank
    if (rank === 2) return styles.silverRank
    if (rank === 3) return styles.bronzeRank
    return styles.defaultRank
  }

  const renderGame = ({ item }: { item: TopGame }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        {/* Ranking */}
        <View style={[styles.rankContainer, getRankStyle(item.rank)]}>
          <Text variant="titleLarge" style={styles.rankNumber}>
            {item.rank}
          </Text>
        </View>

        {/* Nome do jogo  */}
        <Text variant="titleLarge" style={styles.gameName}>
          {item.name}
        </Text>

   
        <View style={styles.mainSection}>
          {/* Imagem do jogo */}
          <View style={styles.gameImageContainer}>
            {item.thumbnail_url ? (
              <Image source={{ uri: item.thumbnail_url }} style={styles.gameImage} resizeMode="cover" />
            ) : (
              <Image
                source={require("../../app/assets/ludoimg.png")}
                style={[styles.gameImage, styles.placeholderImage]}
                resizeMode="contain" 
              />
            )}
          </View>

          {/*  informações */}
          <View style={styles.chipsContainer}>
            <Chip icon="account-group" compact style={styles.detailChip}>
              {item.min_players}-{item.max_players} jogadores
            </Chip>
            <Chip icon="clock" compact style={styles.detailChip}>
              {item.playing_time} min
            </Chip>
          </View>
        </View>

        {/* Avaliação  */}
        <View style={styles.ratingSection}>
          <View style={styles.starsContainer}>{renderStars(item.average_rating)}</View>
          <Text variant="headlineSmall" style={styles.score}>
            {item.average_rating.toFixed(2)}
          </Text>
        </View>

        {/* avaliações */}
     
        <Text variant="bodyMedium" style={styles.evaluationsCount}>
          {item.total_evaluations} avaliaç{item.total_evaluations !== 1 ? "ões" : "ão"}
        </Text>

       
        <Button mode="contained" onPress={() => router.push(`/(drawer)/game/${item.id}`)} style={styles.detailsButton}>
          Ver Detalhes
        </Button>
      </Card.Content>
    </Card>
  )

  useEffect(() => {
    fetchTopGames()
  }, [])

  if (topGames.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Ainda não há jogos avaliados
        </Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Seja o primeiro a avaliar um jogo!
        </Text>
        <Button mode="contained" onPress={() => router.push("/(drawer)/feed")} style={styles.feedButton}>
          Ver Jogos
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
     
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Top Jogos Mais Bem Avaliados
        </Text>
        <Text variant="bodySmall" style={styles.headerSubtitle}>
         • Baseado nas avaliações da comunidade
        </Text>
      </View>

      <FlatList
        data={topGames}
        renderItem={renderGame}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
  },
  headerTitle: {
    color: "#333333",
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#666666",
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  cardContent: {
    padding: 20,
    alignItems: "center",
    position: "relative",
  },
  rankContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  goldRank: {
    backgroundColor: "#FFD700",
  },
  silverRank: {
    backgroundColor: "#C0C0C0",
  },
  bronzeRank: {
    backgroundColor: "#CD7F32",
  },
  defaultRank: {
    backgroundColor: "#d2b4fc",
  },
  rankNumber: {
    fontWeight: "bold",
    color: "#000000",
    fontSize: 20,
  },
  gameName: {
    color: "#6200ee",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  mainSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    //marginBottom: 20,
    width: "100%",
  },
  gameImageContainer: {
    marginRight: 16,
  },
  gameImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  chipsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  detailChip: {
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    //marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  score: {
    color: "#FFD700",
    fontWeight: "bold",
    
  },
  evaluationsCount: {
    color: "#666666",
    textAlign: "center",
    marginBottom: 16,
  },
  detailsButton: {
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
  },
  feedButton: {
    paddingHorizontal: 24,
  },
})
