from typing import List, Dict, Any, Optional

def generate_recommendations(
    disease_class: Optional[str],
    disease_uncertain: bool,
    pest_count: int,
    pest_names: List[str]
) -> List[Dict[str, str]]:
    """
    Generates cautious, evidence-backed agronomic guidance without prescribing
    unverified chemical dosages or dangerous pesticides.
    """
    recommendations: List[Dict[str, str]] = []

    # 1. Verification warning if uncertain
    if disease_uncertain:
        recommendations.append({
            "category": "Verification Required",
            "title": "Field Verification Recommended",
            "details": "Model confidence is below the high-certainty benchmark. Isolate the affected plant and have a physical sample evaluated by a local agricultural extension specialist before taking corrective actions."
        })

    # 2. Disease-specific agronomic advice
    if disease_class == "Healthy":
        recommendations.append({
            "category": "Maintenance",
            "title": "Continue Preventative Crop Monitoring",
            "details": "Maintain regular weekly crop scouting. Check leaf undersides and lower canopy zones for early pathogen colonization."
        })
        recommendations.append({
            "category": "Cultural Management",
            "title": "Canopy Airflow & Irrigation Care",
            "details": "Ensure adequate spacing between plants to maximize air circulation. Utilize drip irrigation rather than overhead sprinklers to minimize leaf wetness duration."
        })
    elif disease_class == "Powdery":
        recommendations.append({
            "category": "Canopy & Moisture Control",
            "title": "Reduce Leaf Wetness and Relative Humidity",
            "details": "Thin out excess dense foliage to improve sunlight penetration and air movement. Water at ground level early in the morning to prevent prolonged dampness."
        })
        recommendations.append({
            "category": "Sanitation",
            "title": "Sanitation and Removal of Infected Foliage",
            "details": "Gently remove severely infected leaves with sanitized tools and dispose of them away from the field. Do not leave infected residues on soil surfaces."
        })
        recommendations.append({
            "category": "Agronomic Guidance",
            "title": "Consult Extension Officer for Approved Management",
            "details": "Consult your local university or regional agricultural extension department for approved biorational controls (such as potassium bicarbonate or horticultural oils suitable for your crop)."
        })
    elif disease_class == "Rust":
        recommendations.append({
            "category": "Sanitation & Residue Disposal",
            "title": "Immediate Crop Sanitation",
            "details": "Collect and safely destroy heavily infected leaves to stop urediniospore dispersal by wind. Clean tools with 70% alcohol or disinfectant between rows."
        })
        recommendations.append({
            "category": "Cultural Practice",
            "title": "Manage Nitrogen and Airflow",
            "details": "Avoid excessive nitrogen fertilization which produces lush, vulnerable vegetative growth. Increase plant row spacing in future plantings to speed up canopy drying."
        })
        recommendations.append({
            "category": "Varietal Selection",
            "title": "Select Resistant Crop Varieties",
            "details": "For subsequent seasons, consult local seed agencies for certified rust-resistant or rust-tolerant cultivars suited for regional climate conditions."
        })

    # 3. Pest recommendations
    if pest_count > 0:
        unique_pests = list(set(pest_names)) if pest_names else ["pest"]
        pest_str = ", ".join(unique_pests)
        recommendations.append({
            "category": "Pest Monitoring",
            "title": f"Targeted Scouting for {pest_str.title()}",
            "details": f"Detected {pest_count} potential pest organism(s). Manually inspect surrounding plants and check leaf abaxial (underside) surfaces to gauge population density."
        })
        recommendations.append({
            "category": "Integrated Pest Management (IPM)",
            "title": "Deploy Physical and Biological Traps",
            "details": "Utilize color-attractant sticky traps or pheromone lures to monitor influx. Encourage natural predators like beneficial ladybird beetles and lacewings."
        })
    else:
        recommendations.append({
            "category": "Pest Management",
            "title": "Maintain Routine Pest Trapping",
            "details": "No significant pests were identified in this sample. Continue regular trap checks and visual monitoring to catch early infestations."
        })

    # 4. Universal caution notice
    recommendations.append({
        "category": "Regulatory & Safety",
        "title": "Advisory Note on Chemical Treatments",
        "details": "Never apply synthetic pesticides or agrochemicals without official confirmation from certified agricultural authorities. Strictly adhere to regional harvest intervals and safety guidelines."
    })

    return recommendations
