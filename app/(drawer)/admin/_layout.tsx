"use client"

import { Stack } from "expo-router"
import { useAuth } from "../../_layout"
import { View, StyleSheet } from "react-native"
import { Text } from "react-native-paper"

export default function AdminLayout() {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text variant="headlineSmall">Acesso Negado</Text>
        <Text variant="bodyMedium">Você não tem permissão para acessar esta área.</Text>
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="games"
        options={{
          title: "Gerenciar Jogos",
        }}
      />
      <Stack.Screen
        name="add-game"
        options={{
          title: "Adicionar Jogo",
        }}
      />
      <Stack.Screen
        name="edit-game/[id]"
        options={{
          title: "Editar Jogo",
        }}
      />
    </Stack>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
})
