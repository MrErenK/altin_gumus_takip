export interface PriceData {
  alis: string;
  satis: string;
  degisim: string;
  oran: string;
  yon: string;
  kur: string;
  sembol: string;
}

export interface ApiResponse {
  success: boolean;
  list: string;
  count: number;
  remaining: number;
  data: Record<string, PriceData>;
}

export async function fetchPrices(symbols: string[]): Promise<ApiResponse> {
  const symbolQuery = symbols.join(",");
  const baseUrl = process.env.API_URL || "https://api.genelpara.com/json/";
  const url = `${baseUrl}?list=altin&sembol=${symbolQuery}`;

  try {
    const response = await fetch(url, {
      headers: process.env.API_KEY ? { "X-Api-Key": process.env.API_KEY } : {},
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch prices: ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();

    if (!data.success) {
      throw new Error("API returned unsuccessful response");
    }

    return data;
  } catch (error) {
    console.error("Error fetching prices:", error);
    throw error;
  }
}
