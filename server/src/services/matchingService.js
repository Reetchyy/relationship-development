import { supabase } from '../config/supabase.js';

// Calculate compatibility between two users
export async function calculateCompatibility(user1, user2) {
  const scores = {
    cultural: 0,
    personality: 0,
    location: 0,
    overall: 0
  };

  // Cultural compatibility (40% weight)
  scores.cultural = calculateCulturalCompatibility(
    user1.cultural_backgrounds?.[0],
    user2.cultural_backgrounds?.[0]
  );

  // Personality compatibility (30% weight)
  scores.personality = calculatePersonalityCompatibility(
    user1.personality_assessments?.[0],
    user2.personality_assessments?.[0]
  );

  // Location compatibility (20% weight)
  scores.location = calculateLocationCompatibility(user1, user2);

  // Age compatibility (10% weight)
  const ageCompatibility = calculateAgeCompatibility(user1, user2);

  // Calculate overall score
  scores.overall = Math.round(
    scores.cultural * 0.4 +
    scores.personality * 0.3 +
    scores.location * 0.2 +
    ageCompatibility * 0.1
  );

  return scores;
}

function calculateCulturalCompatibility(cultural1, cultural2) {
  if (!cultural1 || !cultural2) return 50; // Default score if data missing

  let score = 0;
  let factors = 0;

  // Same primary tribe (high weight)
  if (cultural1.primary_tribe === cultural2.primary_tribe) {
    score += 30;
  } else if (cultural1.secondary_tribes?.includes(cultural2.primary_tribe) ||
             cultural2.secondary_tribes?.includes(cultural1.primary_tribe)) {
    score += 20;
  }
  factors += 30;

  // Shared languages (medium weight)
  const sharedLanguages = cultural1.languages_spoken?.filter(lang =>
    cultural2.languages_spoken?.includes(lang)
  ) || [];
  
  if (sharedLanguages.length > 0) {
    score += Math.min(20, sharedLanguages.length * 5);
  }
  factors += 20;

  // Religion compatibility (medium weight)
  if (cultural1.religion === cultural2.religion) {
    score += 15;
  } else if (cultural1.religion && cultural2.religion) {
    // Different religions but both have religious values
    score += 5;
  }
  factors += 15;

  // Traditional values alignment (medium weight)
  if (cultural1.traditional_values_importance && cultural2.traditional_values_importance) {
    const diff = Math.abs(cultural1.traditional_values_importance - cultural2.traditional_values_importance);
    score += Math.max(0, 15 - (diff * 3));
  }
  factors += 15;

  // Family involvement preference (medium weight)
  if (cultural1.family_involvement_preference && cultural2.family_involvement_preference) {
    const diff = Math.abs(cultural1.family_involvement_preference - cultural2.family_involvement_preference);
    score += Math.max(0, 10 - (diff * 2));
  }
  factors += 10;

  // Birth country (low weight)
  if (cultural1.birth_country === cultural2.birth_country) {
    score += 10;
  }
  factors += 10;

  return Math.round((score / factors) * 100);
}

function calculatePersonalityCompatibility(personality1, personality2) {
  if (!personality1 || !personality2) return 70; // Default score if data missing

  const traits = [
    'openness_score',
    'conscientiousness_score',
    'extraversion_score',
    'agreeableness_score',
    'neuroticism_score'
  ];

  let totalCompatibility = 0;
  let validTraits = 0;

  traits.forEach(trait => {
    if (personality1[trait] !== null && personality2[trait] !== null) {
      const diff = Math.abs(personality1[trait] - personality2[trait]);
      
      // Different compatibility patterns for different traits
      let compatibility;
      
      if (trait === 'neuroticism_score') {
        // Lower neuroticism difference is better
        compatibility = Math.max(0, 100 - (diff * 25));
      } else if (trait === 'agreeableness_score' || trait === 'conscientiousness_score') {
        // High scores in these traits are generally good
        const avgScore = (personality1[trait] + personality2[trait]) / 2;
        compatibility = (avgScore / 5) * 100 - (diff * 10);
      } else {
        // For openness and extraversion, moderate differences can be complementary
        if (diff <= 1) {
          compatibility = 100 - (diff * 15);
        } else {
          compatibility = Math.max(0, 85 - (diff * 20));
        }
      }
      
      totalCompatibility += Math.max(0, Math.min(100, compatibility));
      validTraits++;
    }
  });

  return validTraits > 0 ? Math.round(totalCompatibility / validTraits) : 70;
}

function calculateLocationCompatibility(user1, user2) {
  // Same city = 100%
  if (user1.location_city === user2.location_city && 
      user1.location_country === user2.location_country) {
    return 100;
  }

  // Same country = 70%
  if (user1.location_country === user2.location_country) {
    return 70;
  }

  // Different countries = 30% (diaspora connections)
  return 30;
}

function calculateAgeCompatibility(user1, user2) {
  const age1 = calculateAge(user1.date_of_birth);
  const age2 = calculateAge(user2.date_of_birth);
  
  const ageDiff = Math.abs(age1 - age2);
  
  if (ageDiff <= 2) return 100;
  if (ageDiff <= 5) return 90;
  if (ageDiff <= 8) return 75;
  if (ageDiff <= 12) return 60;
  if (ageDiff <= 15) return 40;
  return 20;
}

function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Get match recommendations using collaborative filtering
export async function getRecommendations(userId, limit = 10) {
  try {
    // Get users with similar preferences who have liked profiles
    const { data: similarUsers, error } = await supabase
      .from('matches')
      .select(`
        user1_id, user2_id, user1_action, user2_action,
        user1:profiles!matches_user1_id_fkey (
          cultural_backgrounds (primary_tribe, religion)
        ),
        user2:profiles!matches_user2_id_fkey (
          cultural_backgrounds (primary_tribe, religion)
        )
      `)
      .or('user1_action.eq.like,user2_action.eq.like')
      .limit(1000);

    if (error) throw error;

    // Simple collaborative filtering logic would go here
    // For now, return empty array as this is a complex algorithm
    return [];

  } catch (error) {
    console.error('Recommendation error:', error);
    return [];
  }
}