import type { Metadata } from "next"

import { CityExperience } from "@/components/city/city-experience"

type ProfilePageProps = {
  params: Promise<{ owner: string }>
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { owner } = await params
  return {
    title: `@${owner} — Repository City`,
    description: `Explore @${owner}'s public GitHub repositories as an interactive isometric city.`,
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { owner } = await params
  return <CityExperience initialRepository={owner} />
}
