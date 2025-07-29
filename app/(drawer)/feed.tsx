"use client"

import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, FlatList, RefreshControl } from "react-native"
import { Text, Searchbar } from "react-native-paper"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../_layout"
import { useRouter } from "expo-router"
import { useFocusEffect } from "@react-navigation/native"
import GameCard from "../../app/components/GameCard"

interface Game {
  id: number
  name: string
  thumbnail_url: string
  description: string
  min_players: number
  max_players: number
  playing_time: number
}

export default function FeedScreen() {
  const [games, setGames] = useState<Game[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const { profile } = useAuth()
  const router = useRouter()

  const fetchGames = async () => {
    try {
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .order("id", { ascending: false })
        .limit(20)

      if (gamesError) {
        console.error("Erro ao buscar jogos:", gamesError)
        return
      }

      setGames(gamesData || [])
    } catch (error) {
      console.error("Erro inesperado:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const searchGames = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const { data, error } = await supabase.from("games").select("*").ilike("name", `%${query}%`).limit(20)

      if (error) {
        console.error("Erro na busca:", error)
        return
      }

      setSearchResults(data || [])
    } catch (error) {
      console.error("Erro inesperado:", error)
    }
  }

  const renderGame = ({ item }: { item: Game }) => (
    <GameCard
      game={item}
      showDate={true}
      dateText={new Date().toLocaleDateString("pt-BR")}
      mainButtonText="Ver Detalhes e Avaliar"
    />
  )

  const renderSearchGame = ({ item }: { item: Game }) => <GameCard game={item} mainButtonText="Ver Detalhes" />


  useFocusEffect(
    useCallback(() => {
      
      const timer = setTimeout(() => {
        fetchGames()
      }, 300)

      return () => clearTimeout(timer)
    }, []),
  )

  useEffect(() => {
    fetchGames()
  }, [])

  useEffect(() => {
    if (showSearch) {
      const timeoutId = setTimeout(() => {
        searchGames(searchQuery)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, showSearch])

  const onRefresh = () => {
    setRefreshing(true)
    fetchGames()
  }

  return (
    <View style={styles.container}>
      {/* Barra de busca */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar jogos..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          onFocus={() => setShowSearch(true)}
          onBlur={() => {
            if (!searchQuery) setShowSearch(false)
          }}
        />
      </View>

      <FlatList
        data={showSearch && searchQuery ? searchResults : games}
        renderItem={showSearch && searchQuery ? renderSearchGame : renderGame}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && !showSearch ? (
            <View style={styles.emptyContainer}>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                Nenhum jogo cadastrado ainda
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Aguarde novos jogos serem adicionados!
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    elevation: 2,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
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
})
