# Knowledge Files Format Guide

This directory contains JSON files that provide information about Deepak Kumar CH. These files are used by the chatbot to answer questions. You can upload multiple JSON files, and all of them will be merged together to create a comprehensive knowledge base.

## JSON Format Structure

All knowledge files **must** follow this structure:

```json
{
  "sectionName1": {
    // Content can be: string, array, object, or any valid JSON structure
  },
  "sectionName2": {
    // Flexible content - any valid JSON structure
  },
  "customSection": {
    // You can add any additional sections you want
  }
}
```

## Format Requirements

1. **Must be valid JSON** - The file must be syntactically correct JSON
2. **Must be an object** - The root must be an object `{}`, not an array `[]` or primitive value
3. **Must have at least one section** - The object cannot be empty
4. **Section names are flexible** - You can use any section names you want
5. **Section content is flexible** - Each section can contain:
   - Strings
   - Arrays
   - Objects
   - Nested structures
   - Any valid JSON data

## Examples

### Example 1: Simple Text Sections

```json
{
  "summary": "Highly motivated software engineer with 5+ years of experience...",
  "skills": "Java, Python, Go, JavaScript, TypeScript, Spring Boot, Angular...",
  "experience": "Worked at DigiCert Inc. as Software Engineer from Mar 2023...",
  "education": "B.Tech in Computer Science from NIST, Berhampur (2016-2020)"
}
```

### Example 2: Structured Sections with Arrays

```json
{
  "skills": {
    "programmingLanguages": ["Java", "Python", "Go", "JavaScript", "TypeScript"],
    "frameworks": ["Spring Boot", "Angular", "Flask", "Gin"],
    "cloud": ["AWS", "Azure", "Docker", "Kubernetes"]
  },
  "experience": [
    {
      "company": "DigiCert Inc.",
      "role": "Software Engineer",
      "period": "Mar 2023 - Present",
      "location": "Bangalore",
      "achievements": [
        "Engineered plugins for certificate management",
        "Improved performance by 20% using multi-threading"
      ]
    }
  ],
  "education": {
    "degree": "B.Tech - Computer Science",
    "institution": "National Institute of Science and Technology",
    "period": "2016-2020"
  }
}
```

### Example 3: Mixed Content Types

```json
{
  "summary": "Experienced software engineer...",
  "skills": ["Java", "Python", "Go"],
  "projects": {
    "project1": {
      "name": "Certificate Management System",
      "technologies": ["Java", "Spring Boot"],
      "description": "Built a system for managing SSL certificates"
    }
  },
  "achievements": [
    "Leetcode Global Rank 6784",
    "Solved 2000+ DSA problems",
    "Infy Insta Award - Twice"
  ],
  "contact": {
    "github": "https://github.com/chdeepakkumar",
    "leetcode": "https://leetcode.com/ChDeepakKumar"
  }
}
```

### Example 4: Custom Sections

```json
{
  "hobbies": ["Reading", "Coding", "Problem Solving"],
  "certifications": [
    {
      "name": "AWS Certified Developer",
      "year": 2023
    }
  ],
  "languages": {
    "english": "Fluent",
    "hindi": "Native",
    "telugu": "Native"
  },
  "interests": {
    "technical": ["System Design", "Distributed Systems", "Cloud Computing"],
    "personal": ["Travel", "Photography"]
  }
}
```

## How Sections Are Merged

When multiple JSON files are uploaded, sections are merged as follows:

- **Same section name**: 
  - If both are arrays → Arrays are combined
  - If both are objects → Objects are merged (new keys override old ones)
  - Otherwise → New value replaces old value

- **Different section names**: All sections are kept

### Example of Merging

**File 1:**
```json
{
  "skills": ["Java", "Python"],
  "experience": "Worked at DigiCert"
}
```

**File 2:**
```json
{
  "skills": ["Go", "JavaScript"],
  "education": "B.Tech from NIST"
}
```

**Result:**
```json
{
  "skills": ["Java", "Python", "Go", "JavaScript"],
  "experience": "Worked at DigiCert",
  "education": "B.Tech from NIST"
}
```

## Best Practices

1. **Use descriptive section names** - Make section names clear and meaningful
2. **Keep related information together** - Group related data in the same section
3. **Use consistent structure** - If you have multiple files, try to use similar structures for similar sections
4. **Don't duplicate information** - The system will merge sections, so avoid exact duplicates
5. **Use arrays for lists** - If you have multiple items of the same type, use arrays
6. **Use objects for structured data** - If you have key-value pairs, use objects

## Common Section Names

While you can use any section names, here are some common ones:

- `summary` / `about` / `bio` - Personal or professional summary
- `skills` / `technologies` - Technical skills and technologies
- `experience` / `work` / `employment` - Work experience
- `education` / `academics` - Educational background
- `achievements` / `awards` - Achievements and awards
- `projects` / `portfolio` - Projects and portfolio items
- `contact` / `links` - Contact information and links
- `certifications` - Professional certifications
- `languages` - Programming or spoken languages
- `interests` / `hobbies` - Personal interests

## File Naming

- Files are automatically named with timestamps: `knowledge-{timestamp}.json`
- The main portfolio file is: `portfolio.json` (contains all portfolio sections)
- You can upload multiple files to add more information

## Storage

- **Local Development**: Files are stored in `server/data/knowledge/`
- **Vercel Deployment**: Files are stored in Vercel Blob Storage (persists across deployments)
- All uploaded knowledge files persist across server restarts and deployments

## Validation

The system validates uploaded files to ensure:
- ✅ Valid JSON syntax
- ✅ Root is an object (not array or primitive)
- ✅ Object is not empty
- ✅ File size is reasonable (< 10MB)

If validation fails, you'll see a specific error message explaining what's wrong.

## Tips

1. **Start with the main resume** - The system automatically converts your PDF resume to `resume.json`
2. **Add supplementary files** - Upload additional JSON files for more detailed information
3. **Update as needed** - Delete old files and upload new ones to update information
4. **Test your JSON** - Use a JSON validator before uploading to catch syntax errors
5. **Keep files focused** - Consider splitting information into multiple files for better organization

## Need Help?

If you encounter issues:
1. Check that your JSON is valid using an online JSON validator
2. Ensure the root is an object `{}`, not an array `[]`
3. Make sure the object is not empty
4. Check the file size (must be < 10MB)
5. Review the examples above for proper structure

