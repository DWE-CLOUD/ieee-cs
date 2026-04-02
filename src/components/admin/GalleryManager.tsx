import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Image, Loader2, Star, StarOff, FolderPlus, Images, ArrowLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import GalleryCollaborators from "@/components/admin/GalleryCollaborators";
import { api } from "@/lib/api";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string;
  event_date: string | null;
  is_featured: boolean;
  display_order: number;
  album_id: string | null;
  created_at: string;
}

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  event_date: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  image_count?: number;
}

const categories = ["Event", "Hackathon", "Workshop", "Meetup", "Exhibition", "Award Ceremony", "Team Building"];

const GalleryManager = () => {
  const [activeTab, setActiveTab] = useState("albums");
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  
  // Album dialog
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [albumFormData, setAlbumFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    is_featured: false,
  });
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const [albumCoverPreview, setAlbumCoverPreview] = useState<string | null>(null);
  const [isSavingAlbum, setIsSavingAlbum] = useState(false);

  // Image dialog
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [imageFormData, setImageFormData] = useState({
    title: "",
    description: "",
    category: "Event",
    event_date: "",
    is_featured: false,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchAlbums();
    fetchImages();
  }, []);

  const fetchAlbums = async () => {
    try {
      const albumsData = await api.get<Album[]>("/api/gallery/albums");
      setAlbums(albumsData);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchImages = async (albumId?: string) => {
    setIsLoading(true);
    try {
      const suffix = albumId ? `?albumId=${encodeURIComponent(albumId)}` : "";
      const data = await api.get<GalleryImage[]>(`/api/gallery/images${suffix}`);
      setImages(data || []);
    } catch (error) {
      toast.error("Failed to fetch gallery images");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlbumCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setAlbumCoverFile(file);
      setAlbumCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(validFiles);
    setPreviewUrls(validFiles.map(file => URL.createObjectURL(file)));
  };

  // Album handlers
  const handleAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAlbum(true);

    try {
      const albumData = new FormData();
      albumData.append("title", albumFormData.title);
      albumData.append("description", albumFormData.description || "");
      albumData.append("event_date", albumFormData.event_date || "");
      albumData.append("is_featured", String(albumFormData.is_featured));
      albumData.append("cover_image_url", editingAlbum?.cover_image_url || "");
      if (albumCoverFile) {
        albumData.append("cover", albumCoverFile);
      }

      if (editingAlbum) {
        await api.patch(`/api/admin/gallery/albums/${editingAlbum.id}`, albumData);
        toast.success("Album updated successfully");
      } else {
        await api.post("/api/admin/gallery/albums", albumData);
        toast.success("Album created successfully");
      }

      resetAlbumForm();
      setIsAlbumDialogOpen(false);
      fetchAlbums();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save album");
    } finally {
      setIsSavingAlbum(false);
    }
  };

  const handleEditAlbum = (album: Album) => {
    setEditingAlbum(album);
    setAlbumFormData({
      title: album.title,
      description: album.description || "",
      event_date: album.event_date || "",
      is_featured: album.is_featured,
    });
    setAlbumCoverPreview(album.cover_image_url);
    setIsAlbumDialogOpen(true);
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm("Are you sure you want to delete this album? All images in this album will also be deleted.")) return;

    try {
      await api.delete(`/api/admin/gallery/albums/${id}`);
      toast.success("Album deleted successfully");
      fetchAlbums();
      fetchImages();
    } catch (error) {
      toast.error("Failed to delete album");
      console.error(error);
    }
  };

  const resetAlbumForm = () => {
    setAlbumFormData({
      title: "",
      description: "",
      event_date: "",
      is_featured: false,
    });
    setAlbumCoverFile(null);
    setAlbumCoverPreview(null);
    setEditingAlbum(null);
  };

  // Image handlers
  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAlbum) {
      toast.error("Please select an album first");
      return;
    }

    if (selectedFiles.length === 0 && !editingImage) {
      toast.error("Please select at least one image");
      return;
    }

    setIsSavingImage(true);
    setIsUploading(true);

    try {
      if (editingImage) {
        const formData = new FormData();
        formData.append("title", imageFormData.title);
        formData.append("description", imageFormData.description || "");
        formData.append("category", imageFormData.category);
        formData.append("event_date", imageFormData.event_date || "");
        formData.append("is_featured", String(imageFormData.is_featured));
        formData.append("image_url", editingImage.image_url);
        if (selectedFiles.length > 0) {
          formData.append("image", selectedFiles[0]);
        }

        await api.patch(`/api/admin/gallery/images/${editingImage.id}`, formData);
        toast.success("Image updated successfully");
      } else {
        const formData = new FormData();
        formData.append("album_id", selectedAlbum.id);
        formData.append("title", imageFormData.title);
        formData.append("description", imageFormData.description || "");
        formData.append("category", imageFormData.category);
        formData.append("event_date", imageFormData.event_date || "");
        formData.append("is_featured", String(imageFormData.is_featured));
        selectedFiles.forEach((file) => formData.append("images", file));

        await api.post("/api/admin/gallery/images", formData);
        setUploadProgress(100);
        toast.success(`${selectedFiles.length} image(s) added successfully`);
      }

      resetImageForm();
      setIsImageDialogOpen(false);
      fetchImages(selectedAlbum.id);
      fetchAlbums();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save image(s)");
    } finally {
      setIsSavingImage(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditImage = (image: GalleryImage) => {
    setEditingImage(image);
    setImageFormData({
      title: image.title,
      description: image.description || "",
      category: image.category,
      event_date: image.event_date || "",
      is_featured: image.is_featured,
    });
    setPreviewUrls([image.image_url]);
    setIsImageDialogOpen(true);
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await api.delete(`/api/admin/gallery/images/${id}`);
      toast.success("Image deleted successfully");
      if (selectedAlbum) {
        fetchImages(selectedAlbum.id);
      }
      fetchAlbums();
    } catch (error) {
      toast.error("Failed to delete image");
      console.error(error);
    }
  };

  const toggleImageFeatured = async (image: GalleryImage) => {
    const formData = new FormData();
    formData.append("title", image.title);
    formData.append("description", image.description || "");
    formData.append("category", image.category);
    formData.append("event_date", image.event_date || "");
    formData.append("is_featured", String(!image.is_featured));
    formData.append("image_url", image.image_url);

    try {
      await api.patch(`/api/admin/gallery/images/${image.id}`, formData);
      if (selectedAlbum) {
        fetchImages(selectedAlbum.id);
      }
    } catch (error) {
      toast.error("Failed to update image");
    }
  };

  const resetImageForm = () => {
    setImageFormData({
      title: "",
      description: "",
      category: "Event",
      event_date: "",
      is_featured: false,
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setEditingImage(null);
  };

  const openAlbum = (album: Album) => {
    setSelectedAlbum(album);
    fetchImages(album.id);
  };

  const closeAlbum = () => {
    setSelectedAlbum(null);
    fetchImages();
  };

  if (isLoading && !selectedAlbum) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Album images view
  if (selectedAlbum) {
    const albumImages = images.filter(img => img.album_id === selectedAlbum.id);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={closeAlbum}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-serif text-foreground">{selectedAlbum.title}</h2>
              <p className="text-sm text-muted-foreground">{albumImages.length} images</p>
            </div>
          </div>
          <Dialog open={isImageDialogOpen} onOpenChange={(open) => {
            setIsImageDialogOpen(open);
            if (!open) resetImageForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Images
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingImage ? "Edit Image" : "Add Images to Album"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleImageSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Images {!editingImage && "(Select multiple)"}</Label>
                  <div 
                    className={cn(
                      "relative border-2 border-dashed rounded-lg overflow-hidden transition-colors",
                      previewUrls.length > 0 ? "border-transparent" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    )}
                  >
                    {previewUrls.length > 0 ? (
                      <div className="relative">
                        <div className="grid grid-cols-3 gap-2 p-2">
                          {previewUrls.slice(0, 6).map((url, idx) => (
                            <div key={idx} className="aspect-square rounded overflow-hidden">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {previewUrls.length > 6 && (
                            <div className="aspect-square rounded bg-muted flex items-center justify-center">
                              <span className="text-sm text-muted-foreground">+{previewUrls.length - 6} more</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2 border-t">
                          <label className="cursor-pointer text-sm text-primary hover:underline">
                            Change selection
                            <input
                              type="file"
                              accept="image/*"
                              multiple={!editingImage}
                              onChange={handleFilesChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                        <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload images</span>
                        <span className="text-xs text-muted-foreground/60 mt-1">Max 5MB per image</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple={!editingImage}
                          onChange={handleFilesChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="img-title">Title {selectedFiles.length > 1 && "(Base title for all images)"}</Label>
                  <Input
                    id="img-title"
                    value={imageFormData.title}
                    onChange={(e) => setImageFormData({ ...imageFormData, title: e.target.value })}
                    placeholder="Enter image title"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={imageFormData.category}
                    onValueChange={(value) => setImageFormData({ ...imageFormData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsImageDialogOpen(false);
                      resetImageForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSavingImage}>
                    {isSavingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {uploadProgress > 0 ? `${uploadProgress}%` : "Uploading..."}
                      </>
                    ) : editingImage ? (
                      "Update Image"
                    ) : (
                      `Add ${selectedFiles.length || ""} Image${selectedFiles.length !== 1 ? "s" : ""}`
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {albumImages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Image className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No images in this album yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsImageDialogOpen(true)}
              >
                Add images
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albumImages.map((image) => (
              <Card key={image.id} className="overflow-hidden group">
                <div className="relative aspect-square">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  {image.is_featured && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </div>
                  )}
                  <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => toggleImageFeatured(image)}
                    >
                      {image.is_featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleEditImage(image)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm truncate">{image.title}</h3>
                  <p className="text-xs text-muted-foreground">{image.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Main albums view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-foreground">Gallery Management</h2>
          <p className="text-sm text-muted-foreground">Create albums and manage event photos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowCollaborators(!showCollaborators)}
          >
            <Users className="w-4 h-4" />
            Collaborators
          </Button>
        <Dialog open={isAlbumDialogOpen} onOpenChange={(open) => {
          setIsAlbumDialogOpen(open);
          if (!open) resetAlbumForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FolderPlus className="w-4 h-4" />
              Create Album
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAlbum ? "Edit Album" : "Create New Album"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAlbumSubmit} className="space-y-4">
              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover Image (Optional)</Label>
                <div 
                  className={cn(
                    "relative border-2 border-dashed rounded-lg overflow-hidden transition-colors",
                    albumCoverPreview ? "border-transparent" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  )}
                >
                  {albumCoverPreview ? (
                    <div className="relative aspect-video">
                      <img
                        src={albumCoverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-foreground/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer px-4 py-2 bg-background rounded-lg text-sm font-medium">
                          Change Cover
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAlbumCoverChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload cover image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAlbumCoverChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="album-title">Album Title *</Label>
                <Input
                  id="album-title"
                  value={albumFormData.title}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, title: e.target.value })}
                  placeholder="e.g., Annual Hackathon 2024"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="album-desc">Description</Label>
                <Textarea
                  id="album-desc"
                  value={albumFormData.description}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, description: e.target.value })}
                  placeholder="Describe this album"
                  rows={3}
                />
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="album-date">Event Date</Label>
                <Input
                  id="album-date"
                  type="date"
                  value={albumFormData.event_date}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, event_date: e.target.value })}
                />
              </div>

              {/* Featured */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="album-featured"
                  checked={albumFormData.is_featured}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, is_featured: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="album-featured" className="cursor-pointer">Mark as featured</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAlbumDialogOpen(false);
                    resetAlbumForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSavingAlbum}>
                  {isSavingAlbum ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingAlbum ? (
                    "Update Album"
                  ) : (
                    "Create Album"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Collaborators Section */}
      {showCollaborators && (
        <Card className="p-6">
          <GalleryCollaborators />
        </Card>
      )}

      {albums.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Images className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No albums yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsAlbumDialogOpen(true)}
            >
              Create your first album
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card 
              key={album.id} 
              className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openAlbum(album)}
            >
              <div className="relative aspect-video bg-muted">
                {album.cover_image_url ? (
                  <img
                    src={album.cover_image_url}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Images className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                {album.is_featured && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </div>
                )}
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleEditAlbum(album)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDeleteAlbum(album.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-serif text-lg font-medium">{album.title}</h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-muted-foreground">{album.image_count || 0} images</p>
                  {album.event_date && (
                    <p className="text-xs text-muted-foreground">{album.event_date}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
