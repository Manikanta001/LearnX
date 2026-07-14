import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, User, Edit3, ClipboardList, BookOpen, Sparkles, Download, CheckCircle, Tag } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState<any[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);

  // Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchCerts = async () => {
      try {
        setLoadingCerts(true);
        const res = await api.get('/certificates/my');
        setCertificates(res.data);
      } catch (err) {
        console.error('Fetch certs error:', err);
      } finally {
        setLoadingCerts(false);
      }
    };
    fetchCerts();
  }, [user]);

  const handleOpenEdit = () => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setEducation(profile.education || '');
      setSkillsText(profile.skills?.join(', ') || '');
      setProfilePicture(profile.profilePicture || '');
      setResumeUrl(profile.resumeUrl || '');
      setEditOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updating) return;

    try {
      setUpdating(true);
      const skillsArray = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
      await api.put('/auth/profile', {
        name,
        bio,
        education,
        skills: skillsArray,
        profilePicture,
        resumeUrl,
      });

      await refreshProfile(); // refresh context
      setEditOpen(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Save profile error:', err);
      alert('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const solvedProblemsCount = profile.solvedProblems?.length || 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border text-center overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary to-indigo-600 shrink-0" />
            <CardContent className="p-6 relative">
              {/* Profile Avatar */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full border-4 border-card bg-muted flex items-center justify-center text-muted-foreground overflow-hidden shadow-md">
                {profile.profilePicture ? (
                  <img src={profile.profilePicture} alt={profile.name} className="object-cover w-full h-full" />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground/60" />
                )}
              </div>

              <div className="pt-14 space-y-2">
                <h2 className="text-2xl font-extrabold text-foreground">{profile.name}</h2>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{profile.role}</p>
                <p className="text-sm text-muted-foreground italic max-w-xs mx-auto">
                  {profile.bio || 'This student has not written a bio description yet.'}
                </p>
              </div>

              <div className="pt-6 border-t mt-6 flex justify-center">
                <Button onClick={handleOpenEdit} variant="outline" size="sm" className="rounded-full gap-1">
                  <Edit3 className="h-3.5 w-3.5" /> Edit Profile Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact and Resume details */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">About Me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="font-semibold text-foreground">{profile.email}</p>
              </div>
              {profile.education && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Education</p>
                  <p className="font-semibold text-foreground">{profile.education}</p>
                </div>
              )}
              {profile.resumeUrl && (
                <div className="pt-2 border-t flex justify-start">
                  <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="w-full">
                    <Button variant="outline" size="sm" className="w-full gap-2 rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      View Student Resume PDF <Download className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skill Tag list */}
          {profile.skills && profile.skills.length > 0 && (
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Domain Skills</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill: string) => (
                  <span key={skill} className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {skill}
                  </span>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Certificates list */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Verified Credentials</CardTitle>
              <CardDescription>Generated PDF completion certificates for your completed course tracks.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t">
              {loadingCerts ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : certificates.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Award className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                  <p className="text-sm">You have not earned any certificates yet.</p>
                  <p className="text-xs mt-1">Complete courses to 100% progress to generate certificates automatically.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {certificates.map((cert) => {
                    const downloadUrl = `${api.defaults.baseURL}/certificates/download/${cert.uniqueId}`;
                    return (
                      <div key={cert._id} className="flex justify-between items-center p-4 hover:bg-muted/10 transition-all">
                        <div className="flex items-center gap-3">
                          <Award className="h-5 w-5 text-indigo-600" />
                          <div>
                            <p className="text-sm font-bold text-foreground">{cert.courseName}</p>
                            <p className="text-xs text-muted-foreground">Issued: {new Date(cert.dateEarned).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <a href={downloadUrl} download>
                          <Button size="sm" variant="ghost" className="rounded-full text-primary gap-1">
                            <Download className="h-4 w-4" /> Download PDF
                          </Button>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Details Modal Overlay */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Edit3 className="h-6 w-6 text-primary" /> Edit Profile Details
              </CardTitle>
              <CardDescription>
                Modify your public profile details. Comma-separated tags specify domain skills.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio description</Label>
                  <textarea
                    id="bio"
                    placeholder="Short description about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    placeholder="e.g. B.Tech in CSE"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Domain Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    placeholder="e.g. React, MERN, Data Structures, Java"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profilePicture">Avatar Picture URL</Label>
                  <Input
                    id="profilePicture"
                    type="url"
                    placeholder="https://..."
                    value={profilePicture}
                    onChange={(e) => setProfilePicture(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resumeUrl">Resume PDF URL</Label>
                  <Input
                    id="resumeUrl"
                    type="url"
                    placeholder="https://google-drive-link..."
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Save Updates'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function classNameMap(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
