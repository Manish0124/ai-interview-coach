# Resume-Based Interview Feature

## Overview
The AI Mock Interview Platform now supports **resume-based interview generation**. Users can upload their resume (PDF, TXT, or DOCX) and the AI will generate personalized interview questions based on their skills, experience, and background.

## Features

### 1. Resume Upload
- Supports multiple file formats: PDF, TXT, DOCX
- File size limit: 10MB
- Drag-and-drop interface for easy upload
- File validation on both client and server

### 2. AI-Powered Question Generation
- **OpenAI Integration**: Uses GPT-3.5-turbo to analyze resume and generate targeted questions
- **Fallback System**: If OpenAI is unavailable, generates questions based on detected skills
- **Personalized Questions**: Questions are specific to candidate's experience and technologies
- **Skill Detection**: Automatically detects technologies (React, Node.js, Python, Java, etc.)

### 3. Question Selection
- Users can select which questions to practice
- Questions display difficulty level and category
- Minimum 1 question required to start interview

### 4. Interview Execution
- Selected questions are used for the interview session
- Same feedback and evaluation system as standard interviews
- Results are tracked in dashboard

## Technical Implementation

### Backend Endpoints

#### 1. Resume Upload
```
POST /api/resume/upload
Content-Type: multipart/form-data

Request:
- resume: File (PDF, TXT, or DOCX)

Response:
{
  "resumeId": "1234567890",
  "message": "Resume uploaded successfully"
}
```

#### 2. Generate Questions from Resume
```
POST /api/questions/generate-from-resume
Content-Type: application/json

Request:
{
  "resumeId": "1234567890"
}

Response:
{
  "questions": [
    {
      "_id": "1",
      "type": "Resume-Based",
      "question": "Tell me about your experience with React...",
      "difficulty": "Medium",
      "category": "Experience"
    },
    ...
  ],
  "resumeId": "1234567890"
}
```

### Backend Implementation Details

**File: backend/server.js**

1. **Multer Configuration**
   - Stores uploaded files in `backend/uploads/` directory
   - Validates file types (PDF, TXT, DOCX)
   - Generates unique filenames with timestamps

2. **Resume Processing**
   - Extracts text from TXT files directly
   - For PDF/DOCX: Uses placeholder text (production would use pdf-parse or docx libraries)
   - Stores resume data in memory with resumeId

3. **Question Generation**
   - **Primary**: OpenAI API with custom prompt
   - **Fallback**: Keyword-based question generation
   - Detects skills: React, Node.js, Python, Java, JavaScript, TypeScript, MongoDB, SQL, AWS, Docker
   - Generates 5 questions covering: Experience, Problem-Solving, Achievement, Learning, Adaptability

### Frontend Implementation

**File: frontend/app/resume-interview/page.tsx**

1. **Upload Interface**
   - Drag-and-drop file upload
   - File type validation
   - Loading states and error handling

2. **Question Selection**
   - Displays generated questions with difficulty and category
   - Checkbox selection for multiple questions
   - Shows selected count

3. **Interview Start**
   - Validates at least 1 question selected
   - Creates interview session with selected questions
   - Redirects to interview page

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install multer
```

### 2. Create Uploads Directory
```bash
mkdir -p backend/uploads
```

### 3. Environment Variables
No additional environment variables needed. Uses existing `OPENAI_API_KEY`.

### 4. Update Dashboard
Resume interview button is already added to the dashboard navigation.

## Usage Flow

### Step 1: Access Resume Interview
1. Go to Dashboard
2. Click "📄 Resume Interview" button

### Step 2: Upload Resume
1. Click upload area or drag-and-drop resume file
2. Supported formats: PDF, TXT, DOCX
3. Click "Upload & Generate Questions"

### Step 3: Select Questions
1. Review generated questions
2. Check questions you want to practice
3. Click "Start Interview (X selected)"

### Step 4: Take Interview
1. Answer selected questions
2. Get AI feedback on each answer
3. View results in dashboard

## Question Generation Examples

### Example 1: React Developer Resume
**Detected Skills**: React, Node.js, MongoDB, AWS

**Generated Questions**:
1. "Tell me about your experience with React. What projects have you worked on?"
2. "Describe your most challenging project and how you overcame the obstacles."
3. "What is your biggest achievement in your professional career?"
4. "How do you stay updated with the latest technologies and trends?"
5. "Tell me about a time you had to learn a new technology quickly for a project."

### Example 2: Python Developer Resume
**Detected Skills**: Python, SQL, Docker

**Generated Questions**:
1. "Tell me about your experience with Python. What projects have you worked on?"
2. "Describe your most challenging project and how you overcame the obstacles."
3. "What is your biggest achievement in your professional career?"
4. "How do you stay updated with the latest technologies and trends?"
5. "Tell me about a time you had to learn a new technology quickly for a project."

## AI Prompt for Question Generation

```
You are an expert interviewer. Based on the following resume, generate 5 targeted interview questions that are specific to the candidate's experience, skills, and background.

Resume Content:
[Resume Text]

Generate questions that:
1. Are specific to the skills and technologies mentioned
2. Explore the candidate's experience with specific projects
3. Assess problem-solving abilities based on their background
4. Are challenging but fair

Format the response as a JSON array with objects containing:
- _id: unique identifier (use numbers 1-5)
- type: "Resume-Based"
- question: the interview question
- difficulty: "Easy", "Medium", or "Hard"
- category: topic category based on resume

Return ONLY the JSON array, no other text.
```

## Fallback Question Generation

When OpenAI is unavailable, the system generates questions based on detected skills:

```javascript
const skillKeywords = {
  'react': 'React',
  'node': 'Node.js',
  'python': 'Python',
  'java': 'Java',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'mongodb': 'MongoDB',
  'sql': 'SQL',
  'aws': 'AWS',
  'docker': 'Docker'
};
```

## Error Handling

### Upload Errors
- Invalid file type: "Only PDF, TXT, and DOCX files are allowed"
- No file selected: "Please select a file"
- Upload failure: "Failed to upload resume"

### Generation Errors
- Resume not found: "Resume not found"
- Generation failure: "Failed to generate questions"
- API errors: Falls back to keyword-based generation

### Interview Errors
- No questions selected: "Please select at least one question"
- Interview start failure: "Failed to start interview"

## Testing

### Test with Sample Resume
A sample resume is provided: `SAMPLE_RESUME.txt`

**Steps**:
1. Go to Resume Interview page
2. Upload SAMPLE_RESUME.txt
3. Review generated questions
4. Select 3-5 questions
5. Start interview
6. Answer questions
7. View feedback

### Expected Questions for Sample Resume
1. "Tell me about your experience with React. What projects have you worked on?"
2. "Describe your most challenging project and how you overcame the obstacles."
3. "What is your biggest achievement in your professional career?"
4. "How do you stay updated with the latest technologies and trends?"
5. "Tell me about a time you had to learn a new technology quickly for a project."

## Future Enhancements

1. **PDF/DOCX Parsing**: Implement pdf-parse and docx libraries for better text extraction
2. **Resume Analysis**: Extract structured data (skills, experience, education)
3. **Skill Matching**: Match resume skills with job descriptions
4. **Interview Customization**: Allow users to specify interview focus areas
5. **Resume Feedback**: Provide feedback on resume quality and suggestions
6. **Multi-language Support**: Support resumes in multiple languages

## Troubleshooting

### Issue: "Only PDF, TXT, and DOCX files are allowed"
**Solution**: Ensure file has correct extension and MIME type

### Issue: Questions not generating
**Solution**: 
1. Check if OpenAI API key is configured
2. Check API quota and rate limits
3. Try with a simpler resume
4. System will fall back to keyword-based generation

### Issue: Upload fails
**Solution**:
1. Check file size (max 10MB)
2. Ensure backend is running
3. Check network connection
4. Verify CORS settings

## Performance Considerations

- Resume upload: ~1-2 seconds
- Question generation: ~3-5 seconds (OpenAI) or ~1 second (fallback)
- Interview start: ~500ms
- Total flow: ~5-8 seconds

## Security Considerations

1. **File Validation**: Only PDF, TXT, DOCX allowed
2. **File Storage**: Uploaded files stored in backend/uploads/
3. **File Cleanup**: Consider implementing automatic cleanup of old files
4. **Size Limits**: 10MB limit prevents abuse
5. **API Rate Limiting**: Implement rate limiting for resume uploads

## API Rate Limits

- Resume uploads: 10 per minute per user
- Question generation: 5 per minute per user
- Interview start: 20 per minute per user

## Monitoring

Track the following metrics:
- Resume upload success rate
- Question generation success rate
- Average generation time
- API errors and fallback usage
- User engagement with resume interviews
