"use client";

import { generateExcelFormula } from "@/actions/ai";
import { Usage, getUsage } from "@/actions/usage";
import { ExcelData } from "@/app/(home)/excel-parser";
import { createContext, useContext, useEffect, useState } from "react";

export interface FormulaRecord {
  input: string;
  result: string;
  timestamp: number;
  data: ExcelData | null;
}

export interface FormulaPrompt {
  input: string;
  data: ExcelData | null;
}

interface FormulaContextType extends FormulaPrompt {
  records: FormulaRecord[];
  setInput: (input: string) => void;
  isLoading: boolean;
  setData: (data: ExcelData | null) => void;
  generate: () => Promise<string>;
  usage: Usage | null;
}

const FormulaContext = createContext<FormulaContextType | undefined>(undefined);

export function FormulaProvider({
  children,
  maxRecords = 5,
}: {
  children: React.ReactNode;
  maxRecords?: number;
}) {
  const [records, setRecords] = useState<FormulaRecord[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ExcelData | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("formula-records");
    const savedInput = localStorage.getItem("formula-input");
    if (saved) {
      setRecords(JSON.parse(saved));
    }
    if (savedInput) {
      setInput(savedInput);
    }
  }, []);

  useEffect(() => {
    getUsage().then(setUsage);
  }, []);

  function addRecord(
    promptInput: string,
    formulaResult: string,
    excelData: ExcelData | null,
  ) {
    const newRecord = {
      input: promptInput,
      result: formulaResult,
      timestamp: Date.now(),
      data: excelData,
    };
    const updatedRecords = [newRecord, ...records].slice(0, maxRecords);
    setRecords(updatedRecords);
    localStorage.setItem("formula-records", JSON.stringify(updatedRecords));
  }

  async function generate() {
    try {
      setIsLoading(true);
      const { formula, error } = await generateExcelFormula({
        input,
        data,
      });

      if (error) {
        throw new Error(error);
      }

      addRecord(input, formula, data);
      setInput("");

      const newUsage = await getUsage();
      setUsage(newUsage);

      return formula;
    } finally {
      setIsLoading(false);
    }
  }

  const setInputWithStorage = (newInput: string) => {
    setInput(newInput);
    localStorage.setItem("formula-input", newInput);
  };

  if (!usage) {
    return (
      <FormulaContext.Provider
        value={{
          records,
          input,
          setInput: setInputWithStorage,
          isLoading,
          data,
          setData,
          generate,
          usage: usage,
        }}
      >
        {children}
      </FormulaContext.Provider>
    );
  }

  return (
    <FormulaContext.Provider
      value={{
        records,
        input,
        setInput: setInputWithStorage,
        isLoading,
        data,
        setData,
        generate,
        usage,
      }}
    >
      {children}
    </FormulaContext.Provider>
  );
}

export const useFormula = () => {
  const context = useContext(FormulaContext);
  if (!context)
    throw new Error("useFormula must be used within FormulaProvider");
  return context;
};
