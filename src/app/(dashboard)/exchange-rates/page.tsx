"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ExchangeRate {
  id: string;
  rate_date: string;
  rate_to_base: number;
  source: string;
  currencies: {
    currency_code: string;
    name_en: string;
  };
}

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<<ExchangeRate[]>([]);  // ✅ Fixed: << became <
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRates();
  }, []);

  async function fetchRates() {
    try {
      const res = await fetch("/api/exchange-rates");
      const data = await res.json();
      if (res.ok) setRates(data);
      else toast.error(data.error || "Failed to load");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Exchange Rates</h1>
        <Dialog>
          <DialogTrigger asChild>  {/* ✅ asChild is supported in newer shadcn versions */}
            <Button>Add Rate</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Exchange Rate</DialogTitle>
            </DialogHeader>
            {/* TODO: Add ExchangeRateForm component here */}
            <p className="text-muted-foreground">Form coming soon...</p>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Currency</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Rate to Base</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((rate) => (
            <TableRow key={rate.id}>
              <TableCell>
                {rate.currencies?.currency_code} - {rate.currencies?.name_en}
              </TableCell>
              <TableCell>{rate.rate_date}</TableCell>
              <TableCell>{rate.rate_to_base}</TableCell>
              <TableCell>{rate.source}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}