"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CurrencyForm } from "@/components/currencies/currency-form";

interface Currency {
  id: string;
  currency_code: string;
  name_en: string;
  name_ar: string;
  symbol: string | null;
  decimal_places: number;
  is_base: boolean;
  is_active: boolean;
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  async function fetchCurrencies() {
    try {
      const res = await fetch("/api/currencies");
      const json = await res.json();
      if (json.success) {
        setCurrencies(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this currency?")) return;
    try {
      const res = await fetch(`/api/currencies/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCurrencies();
      }
    } catch (error) {
      console.error("Failed to delete currency:", error);
    }
  }

  useEffect(() => {
    fetchCurrencies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Currencies</h1>
          <p className="text-muted-foreground mt-2">
            Manage currencies and exchange rates
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCurrency(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Currency
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCurrency ? "Edit Currency" : "Add Currency"}
              </DialogTitle>
              <DialogDescription>
                {editingCurrency
                  ? "Update the currency details below."
                  : "Enter the details for the new currency."}
              </DialogDescription>
            </DialogHeader>
            <CurrencyForm
              currency={editingCurrency}
              onSuccess={() => {
                setDialogOpen(false);
                fetchCurrencies();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (AR)</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Decimals</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No currencies found. Add your first currency.
                </TableCell>
              </TableRow>
            ) : (
              currencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell className="font-medium">{currency.currency_code}</TableCell>
                  <TableCell>{currency.name_en}</TableCell>
                  <TableCell>{currency.name_ar}</TableCell>
                  <TableCell>{currency.symbol || "-"}</TableCell>
                  <TableCell>{currency.decimal_places}</TableCell>
                  <TableCell>
                    {currency.is_base ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Yes
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {currency.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCurrency(currency);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(currency.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
