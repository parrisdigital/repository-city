import type { Metadata } from "next"

import { CityExperience } from "@/components/city/city-experience"

type CityPageProps = {
  params: Promise<{ owner: string; repository: string }>
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { owner, repository } = await params
  return {
    title: `${owner}/${repository} — Repository City`,
    description: `Explore ${owner}/${repository} as an interactive isometric city.`,
  }
}

export default async function CityPage({ params }: CityPageProps) {
  const { owner, repository } = await params
  return <CityExperience initialRepository={`${owner}/${repository}`} />
}
