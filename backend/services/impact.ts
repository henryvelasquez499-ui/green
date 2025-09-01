import { DatabaseManager } from "../config/database"

export interface ImpactReport {
  co2Saved: number
  energySaved: number
  waterSaved: number
  totalActions: number
  period: string
}

export interface SustainabilityAction {
  impactValue?: number
  impactUnit?: string
  categoryId: string
}

export class ImpactCalculator {
  private db = DatabaseManager.getInstance()

  // CO2 conversion factors (kg CO2 per unit)
  private co2Factors = {
    kwh: 0.5, // kg CO2 per kWh (average grid)
    km: 0.2, // kg CO2 per km (car vs bike/walk)
    liters: 0.001, // kg CO2 per liter water saved
    kg_co2: 1, // Direct CO2 measurement
  }

  calculateCO2Reduction(actions: SustainabilityAction[]): number {
    return actions.reduce((total, action) => {
      if (!action.impactValue || !action.impactUnit) return total

      const factor = this.co2Factors[action.impactUnit as keyof typeof this.co2Factors] || 0
      return total + action.impactValue * factor
    }, 0)
  }

  calculateEnergyConservation(actions: SustainabilityAction[]): number {
    return actions.reduce((total, action) => {
      if (action.impactUnit === "kwh" && action.impactValue) {
        return total + action.impactValue
      }
      return total
    }, 0)
  }

  calculateWaterConservation(actions: SustainabilityAction[]): number {
    return actions.reduce((total, action) => {
      if (action.impactUnit === "liters" && action.impactValue) {
        return total + action.impactValue
      }
      return total
    }, 0)
  }

  async generateImpactReport(userId: string, timeframe: { start: Date; end: Date }): Promise<ImpactReport> {
    const actions = await this.db.query(
      `SELECT impact_value, impact_unit, category_id
       FROM sustainability_actions
       WHERE user_id = $1 
       AND action_date BETWEEN $2 AND $3
       AND verification_status = 'verified'`,
      [userId, timeframe.start, timeframe.end],
    )

    const co2Saved = this.calculateCO2Reduction(actions)
    const energySaved = this.calculateEnergyConservation(actions)
    const waterSaved = this.calculateWaterConservation(actions)

    return {
      co2Saved: Math.round(co2Saved * 100) / 100,
      energySaved: Math.round(energySaved * 100) / 100,
      waterSaved: Math.round(waterSaved * 100) / 100,
      totalActions: actions.length,
      period: `${timeframe.start.toISOString().split("T")[0]} to ${timeframe.end.toISOString().split("T")[0]}`,
    }
  }

  async getCompanyWideImpact(): Promise<ImpactReport> {
    const actions = await this.db.query(
      `SELECT impact_value, impact_unit, category_id
       FROM sustainability_actions
       WHERE verification_status = 'verified'`,
    )

    const co2Saved = this.calculateCO2Reduction(actions)
    const energySaved = this.calculateEnergyConservation(actions)
    const waterSaved = this.calculateWaterConservation(actions)

    return {
      co2Saved: Math.round(co2Saved * 100) / 100,
      energySaved: Math.round(energySaved * 100) / 100,
      waterSaved: Math.round(waterSaved * 100) / 100,
      totalActions: actions.length,
      period: "All time",
    }
  }

  async getCategoryImpact(categoryId: string): Promise<ImpactReport> {
    const actions = await this.db.query(
      `SELECT impact_value, impact_unit, category_id
       FROM sustainability_actions
       WHERE category_id = $1 AND verification_status = 'verified'`,
      [categoryId],
    )

    const co2Saved = this.calculateCO2Reduction(actions)
    const energySaved = this.calculateEnergyConservation(actions)
    const waterSaved = this.calculateWaterConservation(actions)

    return {
      co2Saved: Math.round(co2Saved * 100) / 100,
      energySaved: Math.round(energySaved * 100) / 100,
      waterSaved: Math.round(waterSaved * 100) / 100,
      totalActions: actions.length,
      period: "Category total",
    }
  }
}
