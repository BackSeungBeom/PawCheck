"use client";

import { useCallback, useEffect, useState } from "react";
import type { PetProfile } from "@/lib/decision/evaluate";

const STORAGE_KEY = "pawcheck_pet_profile";

export function usePetProfile() {
  const [profile, setProfileState] = useState<PetProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setProfileState(JSON.parse(raw));
    } catch {
      setProfileState(null);
    }
    setIsLoaded(true);
  }, []);

  const setProfile = useCallback((next: PetProfile) => {
    setProfileState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearProfile = useCallback(() => {
    setProfileState(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { profile, setProfile, clearProfile, isLoaded };
}
