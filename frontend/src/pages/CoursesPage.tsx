import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { GraduationCap, BookOpen, Clock, BarChart, Search, Tag } from 'lucide-react';
import DifficultyBadge from '@/components/DifficultyBadge';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses', {
        params: {
          search: search || undefined,
          category: category || undefined,
        },
      });
      setCourses(res.data);

      // Extract unique categories for filter
      if (categories.length === 0) {
        const uniqueCats: string[] = Array.from(new Set(res.data.map((c: any) => c.category)));
        setCategories(uniqueCats);
      }
    } catch (err) {
      console.error('Fetch courses error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero Headers */}
      <div className="mb-12 text-center sm:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Expand Your <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Knowledge</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
          Explore structured courses designed by top educators. Work through nested modules, practice coding directly in compiler exercises, and earn certified credentials.
        </p>
      </div>

      {/* Filters & Searches */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-24 rounded-full"
          />
          <Button type="submit" size="sm" className="absolute right-1 top-1 h-8 rounded-full">
            Search
          </Button>
        </form>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button
            variant={category === '' ? 'default' : 'outline'}
            onClick={() => setCategory('')}
            size="sm"
            className="rounded-full shrink-0"
          >
            All Categories
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              onClick={() => setCategory(cat)}
              size="sm"
              className="rounded-full shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Courses List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-card">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No Courses Found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            // Calculate total modules and lessons
            const totalModules = course.modules?.length || 0;
            let totalLessons = 0;
            course.modules?.forEach((m: any) => {
              totalLessons += m.lessons?.length || 0;
            });

            return (
              <Card key={course._id} className="flex flex-col overflow-hidden group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=600&auto=format&fit=crop'}
                    alt={course.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <DifficultyBadge difficulty={course.difficulty} />
                  </div>
                </div>

                <CardHeader className="flex-1 pb-2">
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold tracking-wider uppercase mb-1">
                    <Tag className="h-3.5 w-3.5" />
                    {course.category}
                  </div>
                  <CardTitle className="text-xl line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 mt-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 pb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground pt-4 border-t">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{totalModules} Modules</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{totalLessons} Lessons</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/30 border-t p-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    By {course.instructor?.name || 'Instructor'}
                  </span>
                  <Link to={`/courses/${course._id}`}>
                    <Button size="sm" className="rounded-full shadow-sm">
                      View Syllabus
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
