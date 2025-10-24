"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  BarChart3,
  Target,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Mock data for prediction events
const mockEvents = [
  {
    id: "1",
    title: "Global Temperature Rise by 2030",
    description: "Will global average temperature increase by more than 1.5°C by 2030?",
    yesOdds: 0.75,
    noOdds: 0.25,
    marketVolume: "2,450 CUSD",
    closeDate: "2024-12-31",
    status: "active",
    category: "Climate"
  },
  {
    id: "2", 
    title: "Carbon Credit Price Target",
    description: "Will carbon credit prices reach $50/ton by end of 2024?",
    yesOdds: 0.60,
    noOdds: 0.40,
    marketVolume: "1,890 CUSD",
    closeDate: "2024-12-31",
    status: "active",
    category: "Economics"
  },
  {
    id: "3",
    title: "Renewable Energy Adoption",
    description: "Will renewable energy exceed 50% of global electricity by 2025?",
    yesOdds: 0.45,
    noOdds: 0.55,
    marketVolume: "3,200 CUSD",
    closeDate: "2025-01-01",
    status: "active",
    category: "Energy"
  },
  {
    id: "4",
    title: "Ocean Acidification Level",
    description: "Will ocean pH levels drop below 7.8 by 2030?",
    yesOdds: 0.80,
    noOdds: 0.20,
    marketVolume: "980 CUSD",
    closeDate: "2024-11-15",
    status: "closed",
    category: "Environment"
  }
]

// Mock chart data
const mockChartData = [
  { date: "2024-01", odds: 0.45 },
  { date: "2024-02", odds: 0.52 },
  { date: "2024-03", odds: 0.48 },
  { date: "2024-04", odds: 0.55 },
  { date: "2024-05", odds: 0.60 },
  { date: "2024-06", odds: 0.65 },
  { date: "2024-07", odds: 0.70 },
  { date: "2024-08", odds: 0.75 }
]

export default function PredictionMarket() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [betAmount, setBetAmount] = useState("")
  const [betSide, setBetSide] = useState<"yes" | "no" | null>(null)
  const [showBetModal, setShowBetModal] = useState(false)

  const handlePlaceBet = () => {
    // Mock bet placement - in real app this would call API
    console.log("Placing bet:", { selectedEvent, betAmount, betSide })
    setShowBetModal(false)
    setBetAmount("")
    setBetSide(null)
    setSelectedEvent(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Clock className="h-4 w-4" />
      case "closed": return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const EventCard = ({ event }: { event: any }) => (
    <Card className="gaia-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
            <Badge className={getStatusColor(event.status)}>
              {getStatusIcon(event.status)}
              <span className="ml-1 capitalize">{event.status}</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.round(event.yesOdds * 100)}%</div>
              <div className="text-sm text-green-700">YES</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{Math.round(event.noOdds * 100)}%</div>
              <div className="text-sm text-red-700">NO</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{event.marketVolume}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{event.closeDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {event.status === "active" && (
          <>
            <Button
              variant="outline"
              className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
              onClick={() => {
                setSelectedEvent(event)
                setBetSide("yes")
                setShowBetModal(true)
              }}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Buy YES
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => {
                setSelectedEvent(event)
                setBetSide("no")
                setShowBetModal(true)
              }}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Buy NO
            </Button>
          </>
        )}
        
        {event.status === "closed" && (
          <div className="w-full text-center py-2 text-muted-foreground text-sm">
            Market closed - Results pending
          </div>
        )}
      </div>
    </Card>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Prediction Market</h1>
              <p className="text-muted-foreground">Trade on climate and environmental outcomes</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Target className="h-4 w-4" />
              Claim Winnings
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Active Markets</p>
                  <p className="text-3xl font-bold text-primary">{mockEvents.filter(e => e.status === "active").length}</p>
                </div>
                <BarChart3 className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Volume</p>
                  <p className="text-3xl font-bold text-primary">8.5K CUSD</p>
                </div>
                <DollarSign className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Active Traders</p>
                  <p className="text-3xl font-bold text-primary">1,247</p>
                </div>
                <Users className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Your Portfolio</p>
                  <p className="text-3xl font-bold text-primary">2.3K CUSD</p>
                </div>
                <TrendingUp className="text-primary" size={32} />
              </div>
            </Card>
          </div>

          {/* Odds Chart */}
          <Card className="gaia-card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Market Trends</h3>
              <p className="text-sm text-muted-foreground">Historical odds movement for climate predictions</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip 
                    formatter={(value: number) => [`${Math.round(value * 100)}%`, "YES Odds"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="odds" 
                    stroke="#16a34a" 
                    strokeWidth={2}
                    dot={{ fill: "#16a34a", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Events List */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Prediction Events</h2>
            <div className="space-y-4">
              {mockEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bet Modal */}
      <Dialog open={showBetModal} onOpenChange={setShowBetModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Place {betSide?.toUpperCase()} Bet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {selectedEvent?.title}
              </p>
              <p className="text-sm text-foreground">
                Current {betSide === "yes" ? "YES" : "NO"} odds: {Math.round((betSide === "yes" ? selectedEvent?.yesOdds : selectedEvent?.noOdds) * 100)}%
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bet Amount (CUSD)
              </label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
              />
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Potential payout: {betAmount ? `${(parseFloat(betAmount) / (betSide === "yes" ? selectedEvent?.yesOdds : selectedEvent?.noOdds)).toFixed(2)} CUSD` : "0 CUSD"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBetModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePlaceBet}
                disabled={!betAmount || parseFloat(betAmount) <= 0}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Place Bet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
