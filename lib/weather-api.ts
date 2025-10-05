export interface WeatherData {
  temperature: number
  precipitation: number
  elevation?: number
  soilType?: string
}

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  let temperature = 25
  let precipitation = 0
  let elevation = 0
  let soilType = "Unknown"

  // 🌡️ Step 1: Fetch temperature (NASA + Open-Meteo)
  try {
    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN&community=AG&longitude=${lon}&latitude=${lat}&start=20251001&end=20251002&format=JSON`
    const nasaResponse = await fetch(nasaUrl)
    const nasaData = await nasaResponse.json()

    if (nasaData.properties?.parameter?.T2M_MAX) {
      const temps = Object.values(nasaData.properties.parameter.T2M_MAX) as number[]
      const validTemps = temps.filter((t) => t !== -999)
      if (validTemps.length > 0) {
        temperature = validTemps.reduce((a, b) => a + b, 0) / validTemps.length
      }
    }
  } catch (err) {
    console.error("NASA POWER failed, falling back to Open-Meteo:", err)
  }

  try {
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
    const meteoResponse = await fetch(meteoUrl)
    const meteoData = await meteoResponse.json()
    if (meteoData.daily) {
      const avg = (meteoData.daily.temperature_2m_max[0] + meteoData.daily.temperature_2m_min[0]) / 2
      temperature = avg
      precipitation = meteoData.daily.precipitation_sum[0]
    }
  } catch (err) {
    console.error("Open-Meteo failed:", err)
  }

  // 🏔️ Step 2: Fetch elevation
  try {
    const elevationRes = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`
    )
    const elevationData = await elevationRes.json()
    elevation = elevationData.elevation || 0
  } catch (err) {
    console.error("Elevation fetch failed:", err)
  }

  // 🧱 Step 3: Fetch soil type
  try {
    const soilRes = await fetch(`https://api.openepi.io/soil/type?lon=${lon}&lat=${lat}`)
    const soilData = await soilRes.json()
    if (soilData?.properties?.most_probable_soil_type) {
      soilType = soilData.properties.most_probable_soil_type
    }
  } catch (err) {
    console.error("Soil type fetch failed:", err)
  }

  return { temperature, precipitation, elevation, soilType }
}
