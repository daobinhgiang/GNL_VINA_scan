import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import * as SQLite from "expo-sqlite";
import { useMemo } from "react";
import { DatabaseProvider } from "../database/DatabaseProvider";

export default function RootLayout() {
  const expoDb = useMemo(() => SQLite.openDatabaseSync("gnl_vina_scan.db"), []);
  useDrizzleStudio(expoDb);

  return (
    <DatabaseProvider>
      <Stack />
    </DatabaseProvider>
  );
}
