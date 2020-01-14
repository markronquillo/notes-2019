import React from "react";
import { ScrollView, StyleSheet, Text, View, FlatList } from "react-native";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import TodoItem from "./TodoItem";
import LoadOlder from "./LoadOlder";
import LoadNewer from "./LoadNewer";
import CenterSpinner from "../Util/CenterSpinner";

export const FETCH_TODOS = gql`
  query($lastId: Int, $isPublic: Boolean) {
    todos(
      order_by: { created_at: desc }
      where: { _and: { is_public: { _eq: $isPublic }, id: { _lt: $lastId } } }
      limit: 10
    ) {
      id
      title
      is_completed
      created_at
      is_public
      user {
        name
      }
    }
  }
`;

const Todos = ({ isPublic, ...props }) => {
  const [newTodosExist, setNewTodosExist] = React.useState(true);
  const { data, error, loading } = useQuery(FETCH_TODOS, {
    variables: { isPublic }
  });
  if (!data) return null;

  if (error) {
    console.error(error);
    return <Text>Error</Text>;
  }
  if (loading) {
    return <CenterSpinner />;
  }

  return (
    <View style={styles.container}>
      <LoadNewer show={isPublic} styles={styles} isPublic={isPublic} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContainer}
      >
        <FlatList
          data={data.todos}
          renderItem={({ item }) => (
            <TodoItem item={item} isPublic={isPublic} />
          )}
          keyExtractor={item => item.id.toString()}
        />
        <LoadOlder isPublic={isPublic} styles={styles} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollView: {
    flex: 0.8,
    paddingHorizontal: 10,
    backgroundColor: "#F7F7F7"
  },
  scrollViewContainer: {
    justifyContent: "flex-start"
  },
  banner: {
    flexDirection: "column",
    backgroundColor: "#39235A",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5
  },
  pagination: {
    flexDirection: "row",
    backgroundColor: "#39235A",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    borderRadius: 5,
    marginBottom: 20,
    paddingVertical: 5
  },
  buttonText: {
    color: "white"
  }
});

export default Todos;
